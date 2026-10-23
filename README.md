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
Built on **800K+ deliveries**, **5,000+ players**, and **4,500+ matches** across all formats — it powers real-time dashboards, AI-driven match advisors, and franchise analytics.

[Features](#-features) · [Screenshots](#-screenshots) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Reference](#-api-reference)

</div>

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 🏟️ **Live Match Center** | Real-time scores from CricAPI with smart local caching — when API quota is exhausted, EDGE serves the last known good state with a `(Cached)` badge |
| 🏆 **ICC Rankings** | Live ICC player rankings for batting, bowling, and all-rounders across Test, ODI, and T20I |
| 🎯 **IPL Franchise Intelligence Hub** | Select any IPL team and instantly see franchise stats, MVP batter/bowler, and recent match history |
| 📊 **Chase Win Probability Simulator** | Input any match situation (target, overs, wickets, score) and get a real-time chase win probability |
| 🤖 **AI Match Situation Advisor** | Gemini-powered tactical analysis — enter a match state and get AI-generated strategic recommendations |
| 🎳 **AI Bowling Change Recommender** | Type a bowler's name and get AI-driven bowling spell analysis with expected economy and pace/spin recommendations |
| 👤 **Player Profile Cards** | Deep-dive into any player with full career stats across formats and AI-generated biographical summaries |
| 📈 **Leaderboard & Trend Charts** | All-time run scorers, wicket takers, and format-wise statistical leaderboards with interactive Recharts visualizations |

---

## 📸 Screenshots

<div align="center">

### Command Center Dashboard
<img src="docs/screenshot_dashboard.png" width="100%" alt="EDGE Dashboard" />

---

### Live Match Center
<img src="docs/screenshot_live_matches.png" width="100%" alt="Live Match Center" />

---

### AI Match Simulator & Bowling Advisor
<img src="docs/screenshot_match_simulator.png" width="100%" alt="Match Simulator" />

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
    end

    subgraph Data["🗄️ Data Layer"]
        N[(PostgreSQL)]
        O[Prisma ORM]
        P[CricAPI Live Feed]
        Q[Local Cache Fallback]
    end

    subgraph AI["🤖 AI Layer"]
        R[Google Gemini]
        S[Groq Fallback]
    end

    Client --> API
    G --> O --> N
    H --> P
    H --> Q
    I --> O
    J --> R
    J --> S
    K --> O
```

---

## 🗃️ Database Schema

```mermaid
erDiagram
    Player {
        string id PK
        string name
        string country
        string role
        string espnId
        string cricsheetId UK
        string imageUrl
    }
    Match {
        string id PK
        string matchId UK
        string format
        datetime date
        string venue
        string winner
    }
    Delivery {
        string id PK
        string matchId FK
        int inning
        int over
        int ball
        string batter
        string bowler
        int runsTotal
    }
    CareerStat {
        string id PK
        string playerId FK
        string format
        int runs
        float avg
        int wickets
    }
    AuctionHistory {
        string id PK
        string playerId FK
        int year
        string team
        string soldPrice
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

## ⚡ Quick Start

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | ≥ 20 | [nodejs.org](https://nodejs.org) |
| **PostgreSQL** | ≥ 14 | Local install **or** free [Supabase](https://supabase.com) |
| **Python** | ≥ 3.9 | For ETL data ingestion |

### Step 1 — Clone & Install

```bash
git clone https://github.com/DHRUVASAI/EDGE---Evidence-Driven-Game-Engine.git
cd EDGE---Evidence-Driven-Game-Engine
npm install
```

### Step 2 — Set Up Environment

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
# PostgreSQL — local install default:
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/cricmetrics"

# Live match scores (free 100 req/day): https://cricapi.com
CRICAPI_KEY="your_cricapi_key_here"

# AI features — Google Gemini (free): https://aistudio.google.com/app/apikey
GOOGLE_API_KEY="your_google_gemini_api_key_here"

# AI fallback — Groq (free, optional): https://console.groq.com
GROQ_API_KEY="your_groq_api_key_here"
```

> **Only `DATABASE_URL` is strictly required** to run the app. `CRICAPI_KEY` enables live scores; `GOOGLE_API_KEY` / `GROQ_API_KEY` enable the AI advisor.

### Step 3 — Create the Database

**Option A — Local PostgreSQL:**
```bash
# In psql:
CREATE DATABASE cricmetrics;
```

**Option B — Supabase (free cloud):**
1. Go to [supabase.com](https://supabase.com) → New project
2. Copy the connection string into `DATABASE_URL`

### Step 4 — Run Prisma Migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

This creates all 5 tables with proper indexes.

### Step 5 — Ingest Cricket Data

Download ball-by-ball data from [Cricsheet](https://cricsheet.org/downloads/) (free, JSON format), then:

```bash
cd tools/etl
pip install -r requirements.txt

python ingest_jsons.py      # Ingest Cricsheet ball-by-ball JSONs
python ingest_csvs.py       # Ingest player career CSVs
python compute_aggregates.py
python add_indexes.py
```

> The ETL scripts read `DATABASE_URL` from your root `.env` file automatically.

### Step 6 — Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

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
| `/api/h2h?batter=...&bowler=...` | GET | Head-to-head batter vs bowler statistics |
| `/api/recommend` | POST | AI-powered match situation analysis and bowling recommendations |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Frontend** | React 19, Framer Motion, Recharts, Lucide Icons |
| **Styling** | Tailwind CSS 4 |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 6 |
| **AI (Primary)** | Google Gemini |
| **AI (Fallback)** | Groq |
| **Live Data** | CricAPI |
| **Language** | TypeScript 5 |
| **Data Ingestion** | Python ETL pipeline (Cricsheet, ESPN, SportMonks) |

---

## 📁 Project Structure

```
EDGE/
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
│   └── lib/                         #   Utility functions & Prisma client
│
├── prisma/                          # Database schema & migrations
│   ├── schema.prisma                #   Prisma data model (5 tables)
│   └── migrations/                  #   SQL migration history
│
├── public/                          # Static assets
│
├── tools/                           # Offline tooling (not part of web app)
│   └── etl/                         #   CSV/JSON ingestion pipeline
│       ├── ingest_jsons.py
│       ├── ingest_csvs.py
│       ├── compute_aggregates.py
│       ├── add_indexes.py
│       └── requirements.txt
│
├── 1_Data_Sources/                  # Architecture documentation
├── 2_Ingestion_Layer/
├── 3_Storage_Layer/
├── 4_Processing_Layer/
├── 5_Serving_Layer/
│
├── .env.example                     # ← Copy this to .env and fill in your keys
├── package.json
└── tsconfig.json
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
