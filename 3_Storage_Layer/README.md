# Layer 3: Storage Layer

Houses relational database schemas, Prisma ORM models, and Data Lake raw JSON archives.

## Component Layout
* **PostgreSQL Database & Prisma ORM**: Located under `prisma/`
  - `schema.prisma`: Defines 5 core relational tables:
    1. `Delivery` (800,000+ ball-by-ball delivery records)
    2. `Match` (4,500+ match metadata records)
    3. `Player` (5,000+ player profile records)
    4. `CareerStat` (Format career statistics)
    5. `AuctionHistory` (IPL auction history records)
* **Data Lake (Raw JSON)**: Raw JSON match archives (`/ipl`, `/odis`, `/t20`, `/tests`).
* **Database Connection Singleton**: Located at `src/lib/prisma.ts`.
