"""
Task 4: pandas vs cuDF benchmark on delivery_features (hackathon demo output).
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time

import pandas as pd
import psycopg2
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
load_dotenv(os.path.join(PROJECT_DIR, ".env"))

SQL = """
SELECT
    df.format,
    df.match_phase,
    COALESCE(psl.bowling_style, 'unknown') AS bowler_type,
    df.runs_on_ball,
    df.wickets_at_ball
FROM delivery_features df
LEFT JOIN player_style_lookup psl ON psl.raw_name = df.bowler
"""

GROUPBY_COLS = ["format", "match_phase", "bowler_type"]


def get_connection():
    url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
    return psycopg2.connect(url)


def check_gpu_environment() -> dict:
    info = {
        "nvidia_smi": False,
        "gpu_name": None,
        "cuda_driver": None,
        "cudf_installed": False,
        "ready": False,
        "missing": [],
    }

    smi = shutil.which("nvidia-smi")
    if smi:
        try:
            out = subprocess.check_output(
                [smi, "--query-gpu=name,driver_version", "--format=csv,noheader"],
                text=True,
                timeout=10,
            ).strip()
            info["nvidia_smi"] = True
            parts = out.split(",")
            info["gpu_name"] = parts[0].strip() if parts else out
            info["cuda_driver"] = parts[1].strip() if len(parts) > 1 else None
        except Exception as exc:
            info["missing"].append(f"nvidia-smi failed: {exc}")
    else:
        info["missing"].append("nvidia-smi not found — no NVIDIA driver/GPU visible")

    try:
        import cudf  # noqa: F401

        info["cudf_installed"] = True
    except ImportError:
        info["missing"].append("cudf not installed")

    info["ready"] = info["nvidia_smi"] and info["cudf_installed"]
    return info


def install_cudf() -> bool:
    print("Installing cudf-cu12 from NVIDIA PyPI index ...")
    cmd = [
        sys.executable,
        "-m",
        "pip",
        "install",
        "--extra-index-url=https://pypi.nvidia.com",
        "cudf-cu12",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr)
        return False
    return True


def pandas_benchmark(conn) -> dict[str, float]:
    t0 = time.perf_counter()
    df = pd.read_sql(SQL, conn)
    t_load = time.perf_counter() - t0

    t0 = time.perf_counter()
    agg = (
        df.groupby(GROUPBY_COLS)
        .agg(
            deliveries=("runs_on_ball", "count"),
            avg_runs=("runs_on_ball", "mean"),
            wicket_rate=("wickets_at_ball", "mean"),
        )
        .reset_index()
    )
    t_groupby = time.perf_counter() - t0

    return {
        "rows": len(df),
        "groups": len(agg),
        "load_s": t_load,
        "groupby_s": t_groupby,
        "total_s": t_load + t_groupby,
    }


def cudf_benchmark(conn) -> dict[str, float]:
    import cudf

    t0 = time.perf_counter()
    pdf = pd.read_sql(SQL, conn)
    gdf = cudf.from_pandas(pdf)
    t_load = time.perf_counter() - t0

    t0 = time.perf_counter()
    agg = (
        gdf.groupby(GROUPBY_COLS)
        .agg({"runs_on_ball": "count", "wickets_at_ball": "mean"})
        .rename(columns={"runs_on_ball": "deliveries", "wickets_at_ball": "wicket_rate"})
    )
    # avg runs separately for clarity
    avg_runs = gdf.groupby(GROUPBY_COLS)["runs_on_ball"].mean()
    agg = agg.merge(avg_runs.rename("avg_runs"), left_index=True, right_index=True)
    t_groupby = time.perf_counter() - t0

    return {
        "rows": len(gdf),
        "groups": len(agg),
        "load_s": t_load,
        "groupby_s": t_groupby,
        "total_s": t_load + t_groupby,
    }


def print_comparison_table(pandas_res: dict, cudf_res: dict | None) -> None:
    print("\n" + "=" * 72)
    print("  TACTIX GPU Benchmark — delivery_features")
    print("=" * 72)
    print(f"  Rows loaded: {pandas_res['rows']:,}  |  Groupby groups: {pandas_res['groups']:,}")
    print(f"  Query: GROUP BY format × match_phase × bowler_type")
    print("-" * 72)
    print(f"  {'Step':<22} {'pandas (s)':>12} {'cuDF (s)':>12} {'Speedup':>12}")
    print("-" * 72)

    if cudf_res:
        for step, key in [
            ("Load from Postgres", "load_s"),
            ("Groupby aggregate", "groupby_s"),
            ("TOTAL", "total_s"),
        ]:
            ps = pandas_res[key]
            cs = cudf_res[key]
            speedup = ps / cs if cs > 0 else float("inf")
            print(f"  {step:<22} {ps:>12.3f} {cs:>12.3f} {speedup:>11.2f}x")
    else:
        for step, key in [
            ("Load from Postgres", "load_s"),
            ("Groupby aggregate", "groupby_s"),
            ("TOTAL", "total_s"),
        ]:
            print(f"  {step:<22} {pandas_res[key]:>12.3f} {'N/A':>12} {'N/A':>12}")

    print("=" * 72)


def main() -> None:
    print("=== Task 4: GPU / cuDF benchmark ===\n")
    env = check_gpu_environment()
    print(f"GPU detected: {env['gpu_name'] or 'none'}")
    print(f"Driver:       {env['cuda_driver'] or 'n/a'}")
    print(f"cuDF ready:   {env['cudf_installed']}")

    if not env["cudf_installed"]:
        if env["nvidia_smi"]:
            ok = install_cudf()
            if ok:
                env = check_gpu_environment()
            else:
                print("\nFAILED to install cudf-cu12.")
                env["missing"].append("pip install cudf-cu12 failed")

    if env["missing"]:
        print("\nEnvironment gaps:")
        for gap in env["missing"]:
            print(f"  - {gap}")

    conn = get_connection()

    print("\nRunning pandas benchmark ...")
    pandas_res = pandas_benchmark(conn)

    cudf_res = None
    if env["ready"] or env["cudf_installed"]:
        try:
            print("Running cuDF benchmark ...")
            cudf_res = cudf_benchmark(conn)
        except Exception as exc:
            print(f"\ncuDF benchmark failed: {exc}")
            print("pandas results still valid for demo slide.")

    conn.close()
    print_comparison_table(pandas_res, cudf_res)


if __name__ == "__main__":
    main()
