"""Phase 4 - Scoring & Selection
================================
Computes composite Player Form Score, recommends Playing XI + Captain,
and generates AI rationale via Gemini API.

Output: player_form_score_{fmt}.csv (for Looker Studio)

This file is intentionally defensive: it only references column names that
exist in the current local parquet outputs created by Phase 3.
"""

import argparse
import os
import sys
import time
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from edge_pipeline.config import (
    FORM_FEATURES_PARQUET,
    FORM_WINDOW_LONG,
    FORM_WINDOW_SHORT,
    PLAYER_SCORE_CSV,
    RAW_DATA_DIRS,
)

# Try to import Gemini
try:
    import google.generativeai as genai

    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print(
        "Warning: google-generativeai not installed. Run: pip install google-generativeai"
    )


# ============================================================
# CONFIGURATION
# ============================================================

WEIGHTS = {
    "recent_form_batting": 0.25,
    "recent_form_bowling": 0.20,
    "venue_form": 0.15,
    "opponent_form": 0.15,
    "long_term_form": 0.10,
    "workload_freshness": 0.10,
    "consistency": 0.05,
}

ROLE_REQUIREMENTS = {
    "WK": 1,
    "BAT": 4,
    "AR": 2,
    "BOWL": 4,
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def normalize_series(s: pd.Series, higher_is_better: bool = True) -> pd.Series:
    """MinMax normalization to 0-1 range."""
    s = pd.to_numeric(s, errors="coerce").fillna(0).astype(float)
    min_val, max_val = s.min(), s.max()
    if max_val == min_val:
        return pd.Series(0.5, index=s.index)
    normalized = (s - min_val) / (max_val - min_val)
    return normalized if higher_is_better else (1 - normalized)


def infer_player_role(row: pd.Series) -> str:
    """Infer player role from merged per-match features."""
    has_bat = float(row.get("balls_faced", 0)) > 10
    has_bowl = float(row.get("balls_bowled", 0)) > 12

    if has_bat and has_bowl:
        return "AR"
    if has_bat:
        return "BAT"
    if has_bowl:
        return "BOWL"
    return "BAT"


def compute_form_score(batting: pd.DataFrame, bowling: pd.DataFrame, fmt: str | None = None) -> pd.DataFrame:
    """Compute composite Player Form Score for each player-match row."""

    # Ensure merge-key dtypes match
    batting = batting.copy()
    bowling = bowling.copy()

    batting["date"] = pd.to_datetime(batting["date"], errors="coerce")
    bowling["date"] = pd.to_datetime(bowling["date"], errors="coerce")

    merged = batting.merge(
        bowling,
        on=[
            "match_id",
            "player",
            "format",
            "date",
            "season",
            "venue",
            "team_a",
            "team_b",
            "opponent",
        ],
        how="outer",
        suffixes=("_bat", "_bowl"),
    )

    # Fill NaNs for expected scoring columns
    for c in ["runs", "sr", "economy", "wickets", "death_economy", "workload_14d"]:
        if c in merged.columns:
            merged[c] = pd.to_numeric(merged[c], errors="coerce").fillna(0)

    # Normalize any suffixed workload column name that may exist
    if "workload_14d" not in merged.columns:
        for alt in ["workload_14d_bowl", "workload_14d_bat"]:
            if alt in merged.columns:
                merged["workload_14d"] = merged[alt]
                break
        if "workload_14d" not in merged.columns:
            merged["workload_14d"] = 0

    # Infer role per match
    merged["role"] = merged.apply(infer_player_role, axis=1)

    # 1) Recent batting (rolling window on runs/sr)
    merged = merged.sort_values(["player", "date"])
    merged["recent_bat_avg"] = merged.groupby("player")["runs"].transform(
        lambda x: x.rolling(FORM_WINDOW_SHORT, min_periods=1).mean()
    )
    merged["recent_bat_sr"] = merged.groupby("player")["sr"].transform(
        lambda x: x.rolling(FORM_WINDOW_SHORT, min_periods=1).mean()
    )
    merged["comp_batting"] = (
        normalize_series(merged["recent_bat_avg"], higher_is_better=True) * 0.6
        + normalize_series(merged["recent_bat_sr"], higher_is_better=True) * 0.4
    )

    # 2) Recent bowling (rolling window on economy & wickets)
    # economy: lower is better => higher_is_better=False
    merged["recent_bowl_econ"] = merged.groupby("player")["economy"].transform(
        lambda x: x.rolling(FORM_WINDOW_SHORT, min_periods=1).mean()
    )
    merged["recent_bowl_wkts"] = merged.groupby("player")["wickets"].transform(
        lambda x: x.rolling(FORM_WINDOW_SHORT, min_periods=1).mean()
    )
    merged["comp_bowling"] = (
        normalize_series(merged["recent_bowl_econ"], higher_is_better=False) * 0.6
        + normalize_series(merged["recent_bowl_wkts"], higher_is_better=True) * 0.4
    )

    # 3) Venue form
    merged["venue_bat_avg"] = merged.groupby(["player", "venue"])["runs"].transform(
        "mean"
    )
    merged["venue_bowl_econ"] = merged.groupby(["player", "venue"])["economy"].transform(
        "mean"
    )
    merged["comp_venue"] = (
        normalize_series(merged["venue_bat_avg"].fillna(0), higher_is_better=True) * 0.5
        + normalize_series(
            merged["venue_bowl_econ"].fillna(merged["economy"].mean()), higher_is_better=False
        )
        * 0.5
    )

    # 4) Opponent form
    merged["opp_bat_avg"] = merged.groupby(["player", "opponent"])["runs"].transform(
        "mean"
    )
    merged["opp_bowl_econ"] = merged.groupby(["player", "opponent"])["economy"].transform(
        "mean"
    )
    merged["comp_opponent"] = (
        normalize_series(merged["opp_bat_avg"].fillna(0), higher_is_better=True) * 0.5
        + normalize_series(
            merged["opp_bowl_econ"].fillna(merged["economy"].mean()),
            higher_is_better=False,
        )
        * 0.5
    )

    # 5) Long-term (rolling long window)
    merged["long_bat_avg"] = merged.groupby("player")["runs"].transform(
        lambda x: x.rolling(FORM_WINDOW_LONG, min_periods=1).mean()
    )
    merged["long_bowl_econ"] = merged.groupby("player")["economy"].transform(
        lambda x: x.rolling(FORM_WINDOW_LONG, min_periods=1).mean()
    )
    merged["comp_longterm"] = (
        normalize_series(merged["long_bat_avg"], higher_is_better=True) * 0.5
        + normalize_series(merged["long_bowl_econ"], higher_is_better=False) * 0.5
    )

    # 6) Workload freshness (higher is better => low workload)
    merged["comp_workload"] = normalize_series(merged["workload_14d"], higher_is_better=False)

    # 7) Consistency (inverse of rolling std of runs)
    merged["bat_consistency"] = merged.groupby("player")["runs"].transform(
        lambda x: x.rolling(FORM_WINDOW_SHORT, min_periods=2).std()
    )
    merged["comp_consistency"] = normalize_series(
        merged["bat_consistency"].fillna(merged["bat_consistency"].median()),
        higher_is_better=False,
    )

    merged["form_score"] = (
        WEIGHTS["recent_form_batting"] * merged["comp_batting"]
        + WEIGHTS["recent_form_bowling"] * merged["comp_bowling"]
        + WEIGHTS["venue_form"] * merged["comp_venue"]
        + WEIGHTS["opponent_form"] * merged["comp_opponent"]
        + WEIGHTS["long_term_form"] * merged["comp_longterm"]
        + WEIGHTS["workload_freshness"] * merged["comp_workload"]
        + WEIGHTS["consistency"] * merged["comp_consistency"]
    )

    merged["form_score_100"] = (merged["form_score"] * 100).round(1)

    return merged


def recommend_xi(scored_df: pd.DataFrame, match_id: str, team: str = "") -> pd.DataFrame:
    """Pick XI based on roles & top form_score_100."""
    match_players = scored_df[(scored_df["match_id"] == match_id)].copy()
    if match_players.empty:
        return pd.DataFrame()

    latest = match_players.sort_values("date").groupby("player").last().reset_index()

    # Keep only players that appear in this match; team membership fields are inconsistent
    # between phases. We rely on match rows themselves; role-based XI is still useful.
    xi_players = []
    for role, count in ROLE_REQUIREMENTS.items():
        role_players = latest[latest["role"] == role].nlargest(count, "form_score_100")
        xi_players.append(role_players)

    xi = pd.concat(xi_players, ignore_index=True) if xi_players else pd.DataFrame()

    # Fill remainder from best remaining
    if len(xi) < 11:
        remaining = latest[~latest["player"].isin(xi["player"])]
        remaining = remaining.nlargest(11 - len(xi), "form_score_100")
        xi = pd.concat([xi, remaining], ignore_index=True)

    # Captain / vice-captain
    xi["is_captain"] = False
    xi["is_vice_captain"] = False
    if not xi.empty:
        cap_idx = xi["form_score_100"].idxmax()
        xi.loc[cap_idx, "is_captain"] = True
        if len(xi) > 1:
            vc_candidates = xi[xi["player"] != xi.loc[cap_idx, "player"]]
            if not vc_candidates.empty:
                vc_idx = vc_candidates["form_score_100"].idxmax()
                xi.loc[vc_idx, "is_vice_captain"] = True

    xi["selection_order"] = range(1, len(xi) + 1)
    return xi[["player", "role", "form_score_100", "is_captain", "is_vice_captain", "selection_order"]]


def generate_gemini_rationale(
    player_name: str,
    role: str,
    form_score: float,
    recent_stats: dict,
    venue_stats: dict,
    opponent_stats: dict,
    api_key: str,
) -> str:
    if not GEMINI_AVAILABLE or not api_key:
        return f"Selected for {role} role based on form score of {form_score:.1f}."

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        Cricket selector rationale (ONE sentence, max 25 words):
        Player: {player_name}
        Role: {role}
        Form Score: {form_score:.1f}/100
        Recent: {recent_stats}
        Venue: {venue_stats}
        vs Opponent: {opponent_stats}
        Tone: Professional, concise, data-driven.
        """
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return f"Selected for {role} role based on form score of {form_score:.1f}."


def run_scoring(fmt: str, gemini_api_key: str | None = None) -> pd.DataFrame:
    bat_path = Path(str(FORM_FEATURES_PARQUET).format(fmt=f"{fmt.lower()}_batting"))
    bowl_path = Path(str(FORM_FEATURES_PARQUET).format(fmt=f"{fmt.lower()}_bowling"))

    if not bat_path.exists() or not bowl_path.exists():
        raise FileNotFoundError(
            f"Feature files not found for {fmt}. Run features first. Missing: {bat_path if not bat_path.exists() else bowl_path}"
        )

    batting = pd.read_parquet(bat_path)
    bowling = pd.read_parquet(bowl_path)

    print(f"[{fmt}] Loaded {len(batting):,} batting, {len(bowling):,} bowling feature rows")

    scored = compute_form_score(batting, bowling, fmt)

    # Demo: pick XI for the latest match per pair; robust even if team_a/team_b columns are missing.
    matches = scored[["match_id", "date", "venue", "opponent", "team_a", "team_b"]].drop_duplicates()
    matches = matches.sort_values("date").groupby("match_id").last().reset_index()
    # Keep only a small sample for speed
    matches = matches.tail(10)

    all_xi = []
    for _, m in matches.iterrows():
        xi = recommend_xi(scored, m["match_id"])
        if xi.empty:
            continue
        xi["match_id"] = m["match_id"]
        # Set team from match data
        team_a = m.get("team_a", "")
        team_b = m.get("team_b", "")
        xi["team"] = team_a if team_a else "Unknown"
        xi["opponent"] = m.get("opponent")
        xi["venue"] = m.get("venue")
        xi["date"] = m["date"]
        all_xi.append(xi)

    xi_df = pd.concat(all_xi, ignore_index=True) if all_xi else pd.DataFrame()

    if not xi_df.empty and gemini_api_key:
        rationales = []
        for _, row in xi_df.iterrows():
            player_data = scored[
                (scored["match_id"] == row["match_id"]) & (scored["player"] == row["player"])
            ]
            latest = player_data.sort_values("date").tail(1)
            if not latest.empty:
                latest_row = latest.iloc[0]
                rationale = generate_gemini_rationale(
                    row["player"],
                    row["role"],
                    float(row["form_score_100"]),
                    {"runs": latest_row.get("runs", 0), "sr": latest_row.get("sr", 0)},
                    {},
                    {},
                    gemini_api_key,
                )
            else:
                rationale = ""
            rationales.append(rationale)
            time.sleep(0.05)
        xi_df["rationale"] = rationales
    else:
        if not xi_df.empty:
            xi_df["rationale"] = xi_df.apply(
                lambda r: f"Selected as {r['role']} with form score {r['form_score_100']:.1f}.",
                axis=1,
            )

    out_path = Path(str(PLAYER_SCORE_CSV).format(fmt=fmt.lower()))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    xi_df.to_csv(out_path, index=False)
    print(f"[{fmt}] Saved XI + scores -> {out_path} ({len(xi_df)} rows)")
    return xi_df


def main():
    parser = argparse.ArgumentParser(
        description="Compute form scores, recommend XI, generate rationale"
    )
    parser.add_argument(
        "--format", choices=list(RAW_DATA_DIRS.keys()) + ["ALL"], default="IPL"
    )
    parser.add_argument("--gemini-key", help="Gemini API key (or set GEMINI_API_KEY env var)")
    args = parser.parse_args()

    api_key = args.gemini_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print(
            "Warning: No Gemini API key provided. Rationales will be template-based."
        )

    formats = list(RAW_DATA_DIRS.keys()) if args.format == "ALL" else [args.format]
    for fmt in formats:
        run_scoring(fmt, api_key)


if __name__ == "__main__":
    main()

