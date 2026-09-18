-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "country" TEXT,
    "role" TEXT,
    "battingStyle" TEXT,
    "bowlingStyle" TEXT,
    "espnId" TEXT,
    "cricsheetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "venue" TEXT,
    "city" TEXT,
    "team1" TEXT,
    "team2" TEXT,
    "winner" TEXT,
    "playerOfMatch" TEXT,
    "tossWinner" TEXT,
    "tossDecision" TEXT,
    "season" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "inning" INTEGER NOT NULL,
    "over" INTEGER NOT NULL,
    "ball" INTEGER NOT NULL,
    "batter" TEXT NOT NULL,
    "bowler" TEXT NOT NULL,
    "nonStriker" TEXT,
    "runsBatter" INTEGER NOT NULL DEFAULT 0,
    "runsExtras" INTEGER NOT NULL DEFAULT 0,
    "runsTotal" INTEGER NOT NULL DEFAULT 0,
    "wicket" JSONB,
    "extras" JSONB,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerStat" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "matches" INTEGER,
    "innings" INTEGER,
    "runs" INTEGER,
    "avg" DOUBLE PRECISION,
    "sr" DOUBLE PRECISION,
    "hundreds" INTEGER,
    "fifties" INTEGER,
    "highScore" TEXT,
    "wickets" INTEGER,
    "bowlAvg" DOUBLE PRECISION,
    "bowlEcon" DOUBLE PRECISION,
    "bowlSR" DOUBLE PRECISION,
    "fiveWickets" INTEGER,

    CONSTRAINT "CareerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionHistory" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "team" TEXT,
    "soldPrice" TEXT,
    "basePrice" TEXT,

    CONSTRAINT "AuctionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_cricsheetId_key" ON "Player"("cricsheetId");

-- CreateIndex
CREATE INDEX "Player_country_idx" ON "Player"("country");

-- CreateIndex
CREATE INDEX "Player_role_idx" ON "Player"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Match_matchId_key" ON "Match"("matchId");

-- CreateIndex
CREATE INDEX "Match_format_idx" ON "Match"("format");

-- CreateIndex
CREATE INDEX "Match_season_idx" ON "Match"("season");

-- CreateIndex
CREATE INDEX "Delivery_matchId_idx" ON "Delivery"("matchId");

-- CreateIndex
CREATE INDEX "Delivery_batter_idx" ON "Delivery"("batter");

-- CreateIndex
CREATE INDEX "Delivery_bowler_idx" ON "Delivery"("bowler");

-- CreateIndex
CREATE INDEX "CareerStat_format_idx" ON "CareerStat"("format");

-- CreateIndex
CREATE UNIQUE INDEX "CareerStat_playerId_format_key" ON "CareerStat"("playerId", "format");

-- CreateIndex
CREATE INDEX "AuctionHistory_playerId_idx" ON "AuctionHistory"("playerId");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerStat" ADD CONSTRAINT "CareerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionHistory" ADD CONSTRAINT "AuctionHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
