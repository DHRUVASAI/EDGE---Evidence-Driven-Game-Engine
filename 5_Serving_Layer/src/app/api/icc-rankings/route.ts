import { NextRequest, NextResponse } from "next/server";

interface RankingPlayer {
  rank: number;
  name: string;
  country: string;
  rating: number;
  imageUrl?: string;
}

interface FormatRankings {
  batting: RankingPlayer[];
  bowling: RankingPlayer[];
  allRounder: RankingPlayer[];
  source: string;
  updatedAt: string;
}

// Fallback data (same as component fallback)
const FALLBACK_DATA: Record<string, FormatRankings> = {
  T20: {
    batting: [
      { rank: 1, name: "Suryakumar Yadav", country: "IND", rating: 861 },
      { rank: 2, name: "Phil Salt", country: "ENG", rating: 802 },
      { rank: 3, name: "Travis Head", country: "AUS", rating: 785 },
      { rank: 4, name: "Babar Azam", country: "PAK", rating: 763 },
      { rank: 5, name: "Mohammad Rizwan", country: "PAK", rating: 752 },
    ],
    bowling: [
      { rank: 1, name: "Adil Rashid", country: "ENG", rating: 726 },
      { rank: 2, name: "Akeal Hosein", country: "WI", rating: 687 },
      { rank: 3, name: "Rashid Khan", country: "AFG", rating: 679 },
      { rank: 4, name: "Wanindu Hasaranga", country: "SL", rating: 662 },
      { rank: 5, name: "Jasprit Bumrah", country: "IND", rating: 658 },
    ],
    allRounder: [
      { rank: 1, name: "Hardik Pandya", country: "IND", rating: 240 },
      { rank: 2, name: "Marcus Stoinis", country: "AUS", rating: 231 },
      { rank: 3, name: "Sikandar Raza", country: "ZIM", rating: 224 },
      { rank: 4, name: "Shakib Al Hasan", country: "BAN", rating: 218 },
      { rank: 5, name: "Liam Livingstone", country: "ENG", rating: 205 },
    ],
    source: "fallback",
    updatedAt: new Date().toISOString(),
  },
  ODI: {
    batting: [
      { rank: 1, name: "Shubman Gill", country: "IND", rating: 826 },
      { rank: 2, name: "Babar Azam", country: "PAK", rating: 824 },
      { rank: 3, name: "Virat Kohli", country: "IND", rating: 791 },
      { rank: 4, name: "Rohit Sharma", country: "IND", rating: 769 },
      { rank: 5, name: "David Warner", country: "AUS", rating: 745 },
    ],
    bowling: [
      { rank: 1, name: "Keshav Maharaj", country: "SA", rating: 716 },
      { rank: 2, name: "Josh Hazlewood", country: "AUS", rating: 688 },
      { rank: 3, name: "Adam Zampa", country: "AUS", rating: 675 },
      { rank: 4, name: "Mohammed Siraj", country: "IND", rating: 661 },
      { rank: 5, name: "Jasprit Bumrah", country: "IND", rating: 654 },
    ],
    allRounder: [
      { rank: 1, name: "Mohammad Nabi", country: "AFG", rating: 320 },
      { rank: 2, name: "Shakib Al Hasan", country: "BAN", rating: 310 },
      { rank: 3, name: "Sikandar Raza", country: "ZIM", rating: 288 },
      { rank: 4, name: "Rashid Khan", country: "AFG", rating: 265 },
      { rank: 5, name: "Glenn Maxwell", country: "AUS", rating: 250 },
    ],
    source: "fallback",
    updatedAt: new Date().toISOString(),
  },
  Test: {
    batting: [
      { rank: 1, name: "Kane Williamson", country: "NZ", rating: 859 },
      { rank: 2, name: "Joe Root", country: "ENG", rating: 824 },
      { rank: 3, name: "Daryl Mitchell", country: "NZ", rating: 768 },
      { rank: 4, name: "Steve Smith", country: "AUS", rating: 757 },
      { rank: 5, name: "Yashasvi Jaiswal", country: "IND", rating: 740 },
    ],
    bowling: [
      { rank: 1, name: "Jasprit Bumrah", country: "IND", rating: 870 },
      { rank: 2, name: "Ravichandran Ashwin", country: "IND", rating: 840 },
      { rank: 3, name: "Josh Hazlewood", country: "AUS", rating: 822 },
      { rank: 4, name: "Pat Cummins", country: "AUS", rating: 811 },
      { rank: 5, name: "Kagiso Rabada", country: "SA", rating: 785 },
    ],
    allRounder: [
      { rank: 1, name: "Ravindra Jadeja", country: "IND", rating: 455 },
      { rank: 2, name: "Ravichandran Ashwin", country: "IND", rating: 340 },
      { rank: 3, name: "Shakib Al Hasan", country: "BAN", rating: 310 },
      { rank: 4, name: "Axar Patel", country: "IND", rating: 285 },
      { rank: 5, name: "Jason Holder", country: "WI", rating: 264 },
    ],
    source: "fallback",
    updatedAt: new Date().toISOString(),
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "T20";
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    console.warn("RAPIDAPI_KEY not found, using fallback rankings");
    return NextResponse.json(FALLBACK_DATA[format] || FALLBACK_DATA["T20"]);
  }

  try {
    // Try cricket-live-data RapidAPI for rankings
    const rankingsUrl = `https://cricket-live-data.p.rapidapi.com/rankings-${format.toLowerCase()}`;
    const response = await fetch(rankingsUrl, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "cricket-live-data.p.rapidapi.com",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (response.ok) {
      const data = await response.json();
      
      // Transform API response to our format
      const transformed: FormatRankings = {
        batting: (data.batting || []).slice(0, 5).map((p: any, i: number) => ({
          rank: i + 1,
          name: p.player || p.name || "Unknown",
          country: p.country || p.team || "N/A",
          rating: parseInt(p.rating || p.points || "0"),
        })),
        bowling: (data.bowling || []).slice(0, 5).map((p: any, i: number) => ({
          rank: i + 1,
          name: p.player || p.name || "Unknown",
          country: p.country || p.team || "N/A",
          rating: parseInt(p.rating || p.points || "0"),
        })),
        allRounder: (data.allrounder || data.allRounder || []).slice(0, 5).map((p: any, i: number) => ({
          rank: i + 1,
          name: p.player || p.name || "Unknown",
          country: p.country || p.team || "N/A",
          rating: parseInt(p.rating || p.points || "0"),
        })),
        source: "icc-live",
        updatedAt: new Date().toISOString(),
      };

      // If we got valid data, return it
      if (transformed.batting.length > 0 || transformed.bowling.length > 0) {
        return NextResponse.json(transformed);
      }
    }
  } catch (error) {
    console.error("Error fetching live ICC rankings:", error);
  }

  // Return fallback data if API fails
  console.log(`Using fallback rankings for ${format}`);
  return NextResponse.json(FALLBACK_DATA[format] || FALLBACK_DATA["T20"]);
}
