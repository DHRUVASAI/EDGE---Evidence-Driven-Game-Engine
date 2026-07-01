<div align="center">

# ⚡ EDGE — Evidence-Driven Game Engine

### AI-Powered Cricket Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-A3E635?style=for-the-badge)](LICENSE)

**EDGE** transforms raw ball-by-ball cricket data into actionable intelligence.  
Built on **800K+ deliveries**, **5,000+ players**, and **4,500+ matches** across all formats — it powers real-time dashboards, AI-driven match advisors, and franchise analytics that professional cricket teams wish they had.

[Features](#-features) · [Screenshots](#-screenshots) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference)

</div>

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 🏟️ **Live Match Center** | Real-time scores from CricAPI with smart local caching — when the API quota is exhausted, EDGE serves the last known good state with a `(Cached)` badge instead of going dark |
| 🏆 **ICC Rankings** | Live ICC player rankings for batting, bowling, and all-rounders across Test, ODI, and T20I formats |
| 🎯 **IPL Franchise Intelligence Hub** | Select any IPL team and instantly see franchise stats, MVP batter/bowler (computed from ball-by-ball data), and recent match history |
| 📊 **Chase Win Probability Simulator** | Input any match situation (target, overs, wickets, score) and get a real-time chase win probability with color-coded risk scoring (High / Medium / Low) |
| 🤖 **AI Match Situation Advisor** | Claude-powered tactical analysis — enter a match state and get AI-generated strategic recommendations for the batting and bowling teams |
| 🎳 **AI Bowling Change Recommender** | Type a bowler's name (with autocomplete) and get AI-driven bowling spell analysis with expected economy, spell patterns, and pace/spin recommendations |
| 👤 **Player Profile Cards** | Deep-dive into any player with full career stats across formats, batting/bowling breakdowns, and AI-generated biographical summaries |
| 📈 **Leaderboard & Trend Charts** | All-time run scorers, wicket takers, and format-wise statistical leaderboards with interactive Recharts visualizations |

---

## 📸 Screenshots

<div align="center">

### Command Center Dashboard
<img src="docs/screenshot_dashboard.png" width="100%" alt="EDGE Dashboard — Command center with real-time stats, delivery counts, and format breakdowns" />

---

### Live Match Center
<img src="docs/screenshot_live_matches.png" width="100%" alt="Live Match Center — Real-time scores with smart caching fallback" />

---

### ICC Rankings
<img src="docs/screenshot_icc_rankings.png" width="100%" alt="ICC Rankings — Live player rankings across Test, ODI, and T20I" />

---

### IPL Franchise Intelligence Hub
<img src="docs/screenshot_ipl_hub.png" width="100%" alt="IPL Franchise Hub — Team stats, MVP performers, and match history" />

---

### Chase Win Probability Simulator
<img src="docs/screenshot_win_probability.png" width="100%" alt="Chase Win Probability — Real-time probability calculation with risk scoring" />

---

### AI Match Simulator & Bowling Advisor
<img src="docs/screenshot_match_simulator.png" width="100%" alt="Match Simulator — AI-powered tactical analysis and bowling change recommendations" />

</div>

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Client (React 19)"]
        A[Dashboard] --> B[Live Matches]
        A --> C[ICC Rankings]
        A --> D[IPL Console]
        A --> E[Win Probability Calculator]
        A --> F[Match Simulator]
    end

    subgraph API["⚡ Next.js API Routes"]
        G["/api/dashboard/summary"]
        H["/api/dashboard/live-matches"]
        I["/api/dashboard/ipl-team"]
        J["/api/recommend"]
        K["/api/player-stats/[id]"]
        L["/api/h2h"]
        M["/api/stats/leaderboard"]
    end

    subgraph Data["🗄️ Data Layer"]
        N[(PostgreSQL<br/>Supabase)]
        O[Prisma ORM]
        P[CricAPI<br/>Live Feed]
        Q[Local Cache<br/>Fallback]
    end

    subgraph AI["🤖 AI Layer"]
        R[Anthropic Claude<br/>Match Analysis]
    end

    Client --> API
    G --> O --> N
    H --> P
    H --> Q
    I --> O
    J --> R
    K --> O
    L --> O
    M --> O
```

---

## 🗃️ Database Schema

The platform is built on 5 core tables ingested from Cricsheet ball-by-ball data and enriched with ESPN, SportMonks, and CricAPI metadata:

```mermaid
erDiagram
    Player {
        string id PK
        string name
        string fullName
        string country
        string role
        string battingStyle
        string bowlingStyle
        string espnId
        string cricsheetId UK
        datetime dob
        string bio
        string imageUrl
    }

    Match {
        string id PK
        string matchId UK
        string format
        datetime date
        string venue
        string team1
        string team2
        string winner
        string playerOfMatch
        string tossWinner
        string tossDecision
        string season
    }

    Delivery {
        string id PK
        string matchId FK
        int inning
        int over
        int ball
        string batter
        string bowler
        int runsBatter
        int runsExtras
        int runsTotal
        json wicket
        json extras
    }

    CareerStat {
        string id PK
        string playerId FK
        string format
        int matches
        int runs
        float avg
        float sr
        int wickets
        float bowlAvg
        float bowlEcon
    }

    AuctionHistory {
        string id PK
        string playerId FK
        int year
        string team
        string soldPrice
        string basePrice
    }

    Player ||--o{ CareerStat : "has"
    Player ||--o{ AuctionHistory : "has"
    Match ||--o{ Delivery : "contains"
```

| Table | Records | Description |
|-------|---------|-------------|
| `Delivery` | **800,000+** | Ball-by-ball data across all international and IPL matches |
| `Match` | **4,500+** | Match metadata — venue, toss, winner, format, season |
| `Player` | **5,000+** | Player profiles with career data from multiple sources |
| `CareerStat` | **12,000+** | Aggregated career statistics per format (Test/ODI/T20) |
| `AuctionHistory` | **3,000+** | IPL auction records — team, base price, sold price |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Frontend** | React 19, Framer Motion, Recharts, Lucide Icons |
| **Styling** | Tailwind CSS 4 |
| **Database** | PostgreSQL 16 (Supabase) |
| **ORM** | Prisma 6 |
| **AI** | Anthropic Claude (Match Advisor) |
| **Live Data** | CricAPI (Live Scores) |
| **Language** | TypeScript 5 |
| **Data Ingestion** | Python ETL pipeline (Cricsheet, ESPN, SportMonks) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** database (or [Supabase](https://supabase.com) free tier)
- **CricAPI Key** from [cricapi.com](https://cricapi.com) (free tier: 100 req/day)
- **Anthropic API Key** for AI features (optional)

### 1. Clone & Install

```bash
git clone https://github.com/DHRUVASAI/EDGE---Evidence-Driven-Game-Engine.git
cd EDGE---Evidence-Driven-Game-Engine
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
CRICAPI_KEY="your_cricapi_key"
ANTHROPIC_API_KEY="sk-ant-your-key"
```

### 3. Set Up Database

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Ingest Data (Optional — if starting from scratch)

```bash
cd tools/etl
pip install -r requirements.txt
python ingest_jsons.py     # Ingest Cricsheet ball-by-ball JSONs
python ingest_csvs.py      # Ingest player career CSVs
python compute_aggregates.py
python add_indexes.py
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see EDGE in action.

---

## 📡 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/summary` | GET | Dashboard counts — total deliveries, players, matches per format |
| `/api/dashboard/live-matches` | GET | Live match scores from CricAPI with local cache fallback |
| `/api/dashboard/ipl-team?teamKey=CSK` | GET | IPL franchise stats, MVP performers, recent matches |
| `/api/dashboard/team-logo?team=India` | GET | Team logo URL lookup |
| `/api/stats/leaderboard` | GET | All-time batting and bowling leaderboards |
| `/api/player-search?q=virat` | GET | Fuzzy player name search with trigram matching |
| `/api/player-stats/[id]` | GET | Full career statistics for a player across all formats |
| `/api/players/[id]` | GET | Player profile with bio and image |
| `/api/players/[id]/deliveries` | GET | Ball-by-ball delivery data for a player |
| `/api/players/[id]/matches` | GET | Match history for a player |
| `/api/h2h?batter=...&bowler=...` | GET | Head-to-head batter vs bowler statistics |
| `/api/recommend` | POST | AI-powered match situation analysis and bowling recommendations |

---

## 📁 Project Structure

```
EDGE---Evidence-Driven-Game-Engine/
├── prisma/                          # Database schema & migrations
│   ├── schema.prisma                #   Prisma data model (5 tables)
│   └── migrations/                  #   SQL migration history
│
├── public/                          # Static assets
│   └── hero.mp4                     #   Landing page hero video
│
├── src/                             # Next.js application source
│   ├── app/                         #   App Router pages & API routes
│   │   ├── page.tsx                 #     Main dashboard
│   │   ├── demo/page.tsx            #     AI Match Simulator
│   │   ├── players/page.tsx         #     Player search & profiles
│   │   └── api/                     #     REST API endpoints
│   │       ├── dashboard/           #       Summary, live matches, IPL team
│   │       ├── stats/               #       Leaderboards
│   │       ├── players/             #       Player data
│   │       ├── h2h/                 #       Head-to-head
│   │       └── recommend/           #       AI advisor
│   │
│   ├── components/                  #   React UI components
│   │   ├── Hero.tsx                 #     Landing hero section
│   │   ├── Navbar.tsx               #     Navigation bar
│   │   ├── Footer.tsx               #     Footer with links
│   │   └── dashboard/               #     Dashboard-specific components
│   │       ├── DashboardHeader.tsx   #       Stats header bar
│   │       ├── LiveMatches.tsx       #       Live match cards
│   │       ├── ICCRankings.tsx       #       ICC ranking tables
│   │       ├── IPLConsole.tsx        #       IPL franchise hub
│   │       ├── WinProbabilityCalculator.tsx  # Chase probability
│   │       └── QuickActions.tsx      #       Feature navigation grid
│   │
│   ├── data/                        #   Cached data (CricAPI fallback)
│   └── lib/                         #   Utility functions
│       ├── prisma.ts                #     Prisma client singleton
│       ├── utils.ts                 #     Helper utilities
│       └── generatePlayerBio.ts     #     AI bio generation
│
├── tools/                           # Offline tooling (not part of web app)
│   ├── analytics/                   #   Feature engineering & benchmarks
│   │   ├── data_audit.py            #     Database quality audit
│   │   ├── task1_backfill_batting_team.py  # Batting team backfill
│   │   ├── task2_delivery_features.py     # Delivery feature engineering
│   │   ├── task3_player_styles.py         # Player style classification
│   │   └── task4_cudf_benchmark.py        # cuDF GPU benchmark
│   │
│   ├── db-seed/                     #   Database seeding & patching
│   │   ├── seed_teams.mjs           #     Team metadata seeder
│   │   ├── import_missing_players.mjs  #  Missing player importer
│   │   ├── patch_players_v2.mjs     #     Player data patches
│   │   └── data/                    #     Seed data files
│   │
│   └── etl/                         #   CSV/JSON ingestion pipeline
│       ├── ingest_jsons.py          #     Cricsheet JSON ingestion
│       ├── ingest_csvs.py           #     CSV data ingestion
│       ├── compute_aggregates.py    #     Career stat aggregation
│       └── requirements.txt         #     Python dependencies
│
├── .env.example                     # Environment variable template
├── LICENSE                          # MIT License
├── package.json                     # Node.js dependencies
└── tsconfig.json                    # TypeScript configuration
```

---

## 👤 Author

**Dhruva Sai**  
[![GitHub](https://img.shields.io/badge/GitHub-DHRUVASAI-181717?style=flat-square&logo=github)](https://github.com/DHRUVASAI)
[![Email](https://img.shields.io/badge/Email-dhruvasai1706@gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:dhruvasai1706@gmail.com)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the love of cricket and data**

</div>
