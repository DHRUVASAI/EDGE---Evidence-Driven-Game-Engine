import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!id || !apiKey) {
    return new NextResponse("Missing team ID or API Key", { status: 400 });
  }

  try {
    // Call the Cricket Live Data team logo endpoint
    const res = await fetch(`https://cricket-live-data.p.rapidapi.com/team-logo/${id}`, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "cricket-live-data.p.rapidapi.com"
      }
    });

    if (!res.ok) {
      return new NextResponse("Logo not found on RapidAPI", { status: 404 });
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400" // cache for 1 day
      }
    });
  } catch (err: any) {
    console.error("Proxy Team Logo Error:", err.message);
    return new NextResponse("Error fetching team logo", { status: 500 });
  }
}
