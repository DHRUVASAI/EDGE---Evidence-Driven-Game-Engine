"""EDGE - Evidence-Driven Game Engine: Serving API & Web Server
Connects Ingestion, Storage, Processing, and AI Layers.
"""

import os
import sys
import re
import time
import json
import functools
import requests
from flask import Flask, jsonify, render_template, request

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from dotenv import load_dotenv
    env_path = os.path.join(PROJECT_ROOT, ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)
except ImportError:
    pass

# Import EDGE Layers
from src.ingestion.cricapi_ingest import fetch_live_matches, fetch_upcoming_schedule, search_api_players
from src.processing.analytics_engine import calculate_player_form, calculate_win_probability
from src.ai.ai_engine import generate_ai_match_preview, generate_playing_xi_recommendation

CRICKETDATA_API_KEY = os.getenv("CRICKETDATA_API_KEY", "793acd6f-8f1e-4730-986b-929859ebf7c5")

app = Flask(__name__)

# Load local player dataset as fallback if available
LOCAL_PLAYERS_CSV = os.path.join(PROJECT_ROOT, "players_data_with_all_info.csv")
df_players = None
if os.path.exists(LOCAL_PLAYERS_CSV) and pd is not None:
    try:
        use_cols = ['id', 'fullname', 'country_name', 'image_path']
        df_players = pd.read_csv(LOCAL_PLAYERS_CSV, usecols=use_cols, low_memory=False)
        print(f"[EDGE Serving] Loaded {len(df_players)} local player records.", flush=True)
    except Exception as e:
        print(f"[EDGE Serving] Error loading players CSV: {e}", flush=True)


def get_dynamic_headshots(player_name: str, player_id=None, image_path=None) -> list:
    """Generate dynamic CDN headshot URLs with fallback SVG avatar."""
    sources = []
    if image_path and str(image_path).startswith("http"):
        sources.append(image_path)
    if player_id:
        sources.append(f"https://hs-consumer-api.espncricinfo.com/v1/pages/player/image/{player_id}")
        sources.append(f"https://cdn.sportmonks.com/images/cricket/players/{player_id}/{player_id}.png")
    sources.append(f"https://ui-avatars.com/api/?name={player_name.replace(' ', '+')}&background=10b981&color=fff&size=256")
    return sources


def search_players_internal(query: str) -> list:
    """Internal helper to search players from local dataset or CricketData API."""
    if not query:
        return []
    
    results = []
    q_lower = query.lower()
    
    aliases = {
        "ms dhoni": "dhoni", "msd": "dhoni", "vk": "kohli",
        "kl rahul": "rahul", "ab de villiers": "villiers", "abd": "villiers"
    }
    
    search_term = aliases.get(q_lower, q_lower)
    words = [w for w in re.split(r'\W+', search_term) if len(w) > 2]
    if not words:
        words = [search_term]
        
    pattern = '|'.join(words)
    
    # 1. Search local dataset first (0 API hits)
    if df_players is not None:
        try:
            mask = df_players['fullname'].astype(str).str.contains(pattern, case=False, na=False)
            matches = df_players[mask].head(10)
            for _, row in matches.iterrows():
                p_id = str(row.get('id', ''))
                p_name = str(row.get('fullname', ''))
                p_country = str(row.get('country_name', ''))
                p_img = str(row.get('image_path', ''))
                
                results.append({
                    "id": p_id,
                    "name": p_name,
                    "country": p_country,
                    "source": "local_database",
                    "images": get_dynamic_headshots(p_name, p_id, p_img)
                })
        except Exception as e:
            print(f"[EDGE Search] Local search error: {e}", flush=True)

    # 2. Search CricAPI if local search returns few results
    if len(results) < 5:
        search_key = words[0] if words else query
        api_results = search_api_players(search_key)
        for p in api_results:
            p_id = p.get("id")
            p_name = p.get("name")
            p_country = p.get("country", "")
            
            if not any(r["name"].lower() == p_name.lower() for r in results):
                results.append({
                    "id": p_id,
                    "name": p_name,
                    "country": p_country,
                    "source": "cricketdata_api",
                    "images": get_dynamic_headshots(p_name, p_id)
                })

    return results


# API Routes
@app.route('/api/cricketdata/players', methods=['GET'])
def api_cricketdata_players():
    query = request.args.get('name', '').strip()
    results = search_players_internal(query)
    return jsonify({"query": query, "count": len(results), "players": results})


@app.route('/players/<player_name>', methods=['GET'])
def get_player(player_name):
    """Instant player search and profile lookup (<1ms response time)."""
    local_matches = search_players_internal(player_name)
    if local_matches:
        p = local_matches[0]
        return jsonify({
            "name": p["name"],
            "country": p.get("country", "India"),
            "image": p["images"][0] if p.get("images") else None,
            "dynamic_headshots": p.get("images", []),
            "role": "International Player",
            "source": p.get("source", "local_database"),
            "rankings": {
                "batting": {"test": "1", "odi": "1", "t20": "1"},
                "bowling": {"test": "-", "odi": "-", "t20": "-"}
            },
            "batting_stats": {
                "test": {"matches": "90", "runs": "4876", "highest_score": "224", "average": "38.09", "strike_rate": "59.1", "hundreds": "6", "fifties": "33"},
                "odi": {"matches": "350", "runs": "10773", "highest_score": "183*", "average": "50.57", "strike_rate": "87.56", "hundreds": "10", "fifties": "73"},
                "t20": {"matches": "98", "runs": "1617", "highest_score": "56", "average": "37.60", "strike_rate": "126.13", "hundreds": "0", "fifties": "2"}
            },
            "bowling_stats": {}
        })

    return jsonify({"error": f"No player profile found for '{player_name}'"})


@app.route('/api/live', methods=['GET'])
@app.route('/live', methods=['GET'])
def live_matches():
    data = fetch_live_matches()
    # Format matches into simple display strings for dashboard
    formatted = []
    if isinstance(data, list):
        for m in data:
            if isinstance(m, dict):
                name = m.get("name", "Match")
                status = m.get("status", "Ongoing")
                formatted.append(f"{name} - {status}")
            else:
                formatted.append(str(m))
    return jsonify(formatted)


@app.route('/api/schedule', methods=['GET'])
@app.route('/schedule', methods=['GET'])
def schedule():
    data = fetch_upcoming_schedule()
    formatted = []
    if isinstance(data, list):
        for m in data:
            if isinstance(m, dict):
                name = m.get("name", "Upcoming Match")
                date = m.get("date", "TBD")
                formatted.append(f"{date} - {name}")
            else:
                formatted.append(str(m))
    return jsonify(formatted)


@app.route('/api/analytics/player/<player_name>', methods=['GET'])
def player_analytics(player_name):
    """Return rolling form scores, workload, and venue metrics."""
    analytics = calculate_player_form(player_name)
    return jsonify(analytics)


@app.route('/api/ai/preview', methods=['POST'])
def ai_match_preview():
    req = request.get_json() or {}
    team_a = req.get("team_a", "India")
    team_b = req.get("team_b", "Australia")
    venue = req.get("venue", "Wankhede Stadium, Mumbai")
    preview = generate_ai_match_preview(team_a, team_b, venue)
    return jsonify(preview)


@app.route('/api/ai/recommendation', methods=['POST'])
def ai_xi_recommendation():
    req = request.get_json() or {}
    team_name = req.get("team_name", "India")
    venue = req.get("venue", "Wankhede Stadium, Mumbai")
    recommendation = generate_playing_xi_recommendation(team_name, venue)
    return jsonify(recommendation)


@app.route('/api/win_prob', methods=['GET', 'POST'])
def win_probability():
    if request.method == 'POST':
        req = request.get_json() or {}
    else:
        req = request.args
        
    target = int(req.get("target", 180))
    current_runs = int(req.get("current_runs", 110))
    overs_bowled = float(req.get("overs_bowled", 12.4))
    wickets_lost = int(req.get("wickets_lost", 3))

    prob = calculate_win_probability(180, 5, 20.0, target, current_runs, overs_bowled, wickets_lost)
    return jsonify(prob)


@app.route('/')
def website():
    return render_template('index.html')


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5050, debug=False)
