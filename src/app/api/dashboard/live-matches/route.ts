import { NextResponse } from "next/server";
import { fetchLiveMatchesInternal } from "@/lib/liveMatchesHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await fetchLiveMatchesInternal();
  return NextResponse.json(result);
}
