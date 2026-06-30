import { NextResponse } from "next/server";

const MOCK_LIVE_DATA = [
  {
    id: 1,
    teams: {
      t1: "PAK",
      t1Name: "Pakistan",
      t1Logo: "bg-emerald-800 text-emerald-200 border-emerald-600",
      t2: "IND",
      t2Name: "India",
      t2Logo: "bg-blue-600 text-white border-blue-400"
    },
    score1: "168/7 (20 Ov)",
    score2: "148/3 (17.2 Ov)",
    overs: "17.2 / 20 Ov",
    status: "Live • India need 21 runs in 16 balls to win this high-voltage clash!",
    venue: "Nassau County Cricket Stadium, New York",
    pitch: "Moderate grass cover. Good carry and bounce. Pacers getting seam movement.",
    winProb1: 32,
    winProb2: 68,
    liveBatsmen: [
      { name: "Virat Kohli", runs: 58, balls: 41, fours: 5, sixes: 2, sr: 141.5 },
      { name: "Rishabh Pant", runs: 24, balls: 15, fours: 2, sixes: 0, sr: 160.0 }
    ],
    liveBowler: { name: "Shaheen Afridi", overs: "3.2", maidens: 0, runs: 28, wickets: 2, econ: 8.4 }
  },
  {
    id: 2,
    teams: {
      t1: "ENG-W",
      t1Name: "England Women",
      t1Logo: "bg-red-700 text-white border-red-500",
      t2: "IND-W",
      t2Name: "India Women",
      t2Logo: "bg-orange-500 text-white border-orange-400"
    },
    score1: "154/6 (20 Ov)",
    score2: "126/3 (15.4 Ov)",
    overs: "15.4 / 20 Ov",
    status: "Live • India Women need 29 runs in 26 balls (Bilateral Series - Game 3)",
    venue: "Lord's Cricket Ground, London",
    pitch: "Dry surface. Offering grip and turn. Spinners dominating in the second innings.",
    winProb1: 40,
    winProb2: 60,
    liveBatsmen: [
      { name: "Smriti Mandhana", runs: 68, balls: 44, fours: 7, sixes: 2, sr: 154.5 },
      { name: "Jemimah Rodrigues", runs: 18, balls: 12, fours: 1, sixes: 0, sr: 150.0 }
    ],
    liveBowler: { name: "Sophie Ecclestone", overs: "3.4", maidens: 0, runs: 21, wickets: 2, econ: 5.7 }
  }
];

export async function GET() {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    return NextResponse.json({ source: "mock", matches: MOCK_LIVE_DATA });
  }

  try {
    // Attempt fetching from Cricbuzz live matches RapidAPI
    const res = await fetch("https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live", {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com"
      },
      next: { revalidate: 15 } // cache for 15 seconds
    });

    if (!res.ok) {
      throw new Error(`RapidAPI returned status ${res.status}`);
    }

    const data = await res.json();
    
    // Parse Cricbuzz response into our dashboard format
    if (data && data.typeMatches) {
      const parsedMatches: any[] = [];
      let idCounter = 1;

      for (const group of data.typeMatches) {
        if (!group.seriesMatches) continue;
        for (const series of group.seriesMatches) {
          if (!series.seriesAdWrapper || !series.seriesAdWrapper.matches) continue;
          for (const m of series.seriesAdWrapper.matches) {
            const matchInfo = m.matchInfo;
            const matchScore = m.matchScore;
            if (!matchInfo) continue;

            const t1 = matchInfo.team1?.teamSName || "T1";
            const t2 = matchInfo.team2?.teamSName || "T2";
            const t1Name = matchInfo.team1?.teamName || "Team 1";
            const t2Name = matchInfo.team2?.teamName || "Team 2";

            const score1 = matchScore?.team1Score
              ? `${matchScore.team1Score.inngs1?.runs || 0}/${matchScore.team1Score.inngs1?.wickets || 0} (${matchScore.team1Score.inngs1?.overs || 0} Ov)`
              : "Yet to bat";
            const score2 = matchScore?.team2Score
              ? `${matchScore.team2Score.inngs1?.runs || 0}/${matchScore.team2Score.inngs1?.wickets || 0} (${matchScore.team2Score.inngs1?.overs || 0} Ov)`
              : "Yet to bat";

            parsedMatches.push({
              id: idCounter++,
              teams: {
                t1,
                t1Name,
                t1Logo: "bg-zinc-800 text-zinc-200 border-zinc-700",
                t2,
                t2Name,
                t2Logo: "bg-lime-400 text-black border-lime-500"
              },
              score1,
              score2,
              overs: matchScore?.team2Score?.inngs1 ? `${matchScore.team2Score.inngs1.overs} Ov` : "0.0 Ov",
              status: matchInfo.status || "Match Live in progress",
              venue: `${matchInfo.venueInfo?.name || "Cricket Ground"}, ${matchInfo.venueInfo?.city || ""}`,
              pitch: "Live game data from Cricbuzz API stream.",
              winProb1: 50,
              winProb2: 50,
              liveBatsmen: [
                { name: "Live Batter 1", runs: 12, balls: 8, fours: 1, sixes: 0, sr: 150 },
                { name: "Live Batter 2", runs: 8, balls: 6, fours: 0, sixes: 0, sr: 133 }
              ],
              liveBowler: { name: "Live Bowler", overs: "1.0", maidens: 0, runs: 6, wickets: 0, econ: 6.0 }
            });

            // Limit to top 3 active live matches
            if (parsedMatches.length >= 3) break;
          }
          if (parsedMatches.length >= 3) break;
        }
        if (parsedMatches.length >= 3) break;
      }

      if (parsedMatches.length > 0) {
        return NextResponse.json({ source: "rapidapi", matches: parsedMatches });
      }
    }

    // Fallback if parsing didn't find active matches
    return NextResponse.json({ source: "mock", matches: MOCK_LIVE_DATA });
  } catch (error: any) {
    console.error("Live Score API Error (using mock fallback):", error.message);
    return NextResponse.json({ source: "mock", matches: MOCK_LIVE_DATA });
  }
}
