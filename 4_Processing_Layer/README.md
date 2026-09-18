# Layer 4: Processing Layer

Executes GPU/CPU-accelerated analytics feature engineering and powers the AI Engine via FreeLLMAPI multi-provider failover.

## Component Layout
* **RAPIDS / cuDF & Analytics Feature Engineering**: Located under `tools/analytics/`
  - `task1_backfill_batting_team.py`: Batting team backfill ETL.
  - `task2_delivery_features.py`: Ball-by-ball feature extraction.
  - `task3_player_styles.py`: Player bowling & batting style classification.
  - `task4_cudf_benchmark.py`: cuDF GPU benchmark evaluation.
* **AI Engine (Gemini + Claude + FreeLLMAPI Gateway)**: Located at `src/lib/aiProvider.ts`
  - Routes prompts through FreeLLMAPI gateway, Google Gemini API, Groq, and Claude.
  - Powers AI Match Advisor, AI Bowling Change Recommender, Dynamic Player Bios, Micro-Battle Engine, and Fantasy Sports Builder.
