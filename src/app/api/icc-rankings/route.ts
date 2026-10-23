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
      { rank: 1, name: "Suryakumar Yadav", country: "IND", rating: 861, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Suryakumar_Yadav_in_PMO_New_Delhi.jpg/330px-Suryakumar_Yadav_in_PMO_New_Delhi.jpg" },
      { rank: 2, name: "Phil Salt", country: "ENG", rating: 802, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/2_02_Phil_Salt.jpg/330px-2_02_Phil_Salt.jpg" },
      { rank: 3, name: "Travis Head", country: "AUS", rating: 785, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/530011.png" },
      { rank: 4, name: "Babar Azam", country: "PAK", rating: 763, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/348144.png" },
      { rank: 5, name: "Mohammad Rizwan", country: "PAK", rating: 752, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/M_Rizwan.jpg/330px-M_Rizwan.jpg" },
    ],
    bowling: [
      { rank: 1, name: "Adil Rashid", country: "ENG", rating: 726, imageUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/30100/30176.png" },
      { rank: 2, name: "Akeal Hosein", country: "WI", rating: 687, imageUrl: "https://static.cricbuzz.com/a/img/v1/152x152/i1/c244976/akeal-hosein.jpg" },
      { rank: 3, name: "Rashid Khan", country: "AFG", rating: 679, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/793463.png" },
      { rank: 4, name: "Wanindu Hasaranga", country: "SL", rating: 662, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Waniya.jpg/330px-Waniya.jpg" },
      { rank: 5, name: "Jasprit Bumrah", country: "IND", rating: 658, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/625383.png" },
    ],
    allRounder: [
      { rank: 1, name: "Hardik Pandya", country: "IND", rating: 240, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/625371.png" },
      { rank: 2, name: "Marcus Stoinis", country: "AUS", rating: 231, imageUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/311500/311520.png" },
      { rank: 3, name: "Sikandar Raza", country: "ZIM", rating: 224, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Sikandar_Raza_2022.jpg/330px-Sikandar_Raza_2022.jpg" },
      { rank: 4, name: "Shakib Al Hasan", country: "BAN", rating: 218, imageUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/56100/56143.png" },
      { rank: 5, name: "Liam Livingstone", country: "ENG", rating: 205, imageUrl: "https://static.cricbuzz.com/a/img/v1/152x152/i1/c244807/liam-livingstone.jpg" },
    ],
    source: "fallback",
    updatedAt: new Date().toISOString(),
  },
  ODI: {
    batting: [
      { rank: 1, name: "Shubman Gill", country: "IND", rating: 826, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3b/Shubman_Gill_2023_%28cropped%29.jpg/330px-Shubman_Gill_2023_%28cropped%29.jpg" },
      { rank: 2, name: "Babar Azam", country: "PAK", rating: 824, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/348144.png" },
      { rank: 3, name: "Virat Kohli", country: "IND", rating: 791, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/253802.png" },
      { rank: 4, name: "Rohit Sharma", country: "IND", rating: 769, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/34102.png" },
      { rank: 5, name: "David Warner", country: "AUS", rating: 745, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/219889.png" },
    ],
    bowling: [
      { rank: 1, name: "Keshav Maharaj", country: "SA", rating: 716, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Keshav_Maharaj_in_2023.jpg/330px-Keshav_Maharaj_in_2023.jpg" },
      { rank: 2, name: "Josh Hazlewood", country: "AUS", rating: 688, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/288284.png" },
      { rank: 3, name: "Adam Zampa", country: "AUS", rating: 675, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Adam_Zampa_2016.jpg/330px-Adam_Zampa_2016.jpg" },
      { rank: 4, name: "Mohammed Siraj", country: "IND", rating: 661, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/940973.png" },
      { rank: 5, name: "Jasprit Bumrah", country: "IND", rating: 654, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/625383.png" },
    ],
    allRounder: [
      { rank: 1, name: "Mohammad Nabi", country: "AFG", rating: 320, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/311427.png" },
      { rank: 2, name: "Shakib Al Hasan", country: "BAN", rating: 310, imageUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/56100/56143.png" },
      { rank: 3, name: "Sikandar Raza", country: "ZIM", rating: 288, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Sikandar_Raza_2022.jpg/330px-Sikandar_Raza_2022.jpg" },
      { rank: 4, name: "Rashid Khan", country: "AFG", rating: 265, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/793463.png" },
      { rank: 5, name: "Glenn Maxwell", country: "AUS", rating: 250, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/325026.png" },
    ],
    source: "fallback",
    updatedAt: new Date().toISOString(),
  },
  Test: {
    batting: [
      { rank: 1, name: "Kane Williamson", country: "NZ", rating: 859, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/277906.png" },
      { rank: 2, name: "Joe Root", country: "ENG", rating: 824, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/303669.png" },
      { rank: 3, name: "Daryl Mitchell", country: "NZ", rating: 768, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/388802.png" },
      { rank: 4, name: "Steve Smith", country: "AUS", rating: 757, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/267192.png" },
      { rank: 5, name: "Yashasvi Jaiswal", country: "IND", rating: 740, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Yashasvi_Jaiswal_in_PMO_New_Delhi.jpg/330px-Yashasvi_Jaiswal_in_PMO_New_Delhi.jpg" },
    ],
    bowling: [
      { rank: 1, name: "Jasprit Bumrah", country: "IND", rating: 870, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/625383.png" },
      { rank: 2, name: "Ravichandran Ashwin", country: "IND", rating: 840, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/26421.png" },
      { rank: 3, name: "Josh Hazlewood", country: "AUS", rating: 822, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/288284.png" },
      { rank: 4, name: "Pat Cummins", country: "AUS", rating: 811, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/272450.png" },
      { rank: 5, name: "Kagiso Rabada", country: "SA", rating: 785, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Kagiso_Rabada_in_2018.jpg/330px-Kagiso_Rabada_in_2018.jpg" },
    ],
    allRounder: [
      { rank: 1, name: "Ravindra Jadeja", country: "IND", rating: 455, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/234675.png" },
      { rank: 2, name: "Ravichandran Ashwin", country: "IND", rating: 340, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/26421.png" },
      { rank: 3, name: "Shakib Al Hasan", country: "BAN", rating: 310, imageUrl: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/56100/56143.png" },
      { rank: 4, name: "Axar Patel", country: "IND", rating: 285, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/554691.png" },
      { rank: 5, name: "Jason Holder", country: "WI", rating: 264, imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Jason_Holder_2019.jpg/330px-Jason_Holder_2019.jpg" },
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
