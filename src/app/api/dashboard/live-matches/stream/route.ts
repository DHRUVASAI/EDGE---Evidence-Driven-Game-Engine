import { NextRequest } from "next/server";
import { fetchLiveMatchesInternal } from "@/lib/liveMatchesHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Send initial match snapshot immediately upon client connection
        const initialData = await fetchLiveMatchesInternal();
        controller.enqueue(
          encoder.encode(`event: snapshot\ndata: ${JSON.stringify(initialData)}\n\n`)
        );
      } catch (err) {
        console.warn("[LiveMatches SSE] Initial snapshot failed:", err);
      }

      // 2. Stream real-time score and probability updates every 12 seconds
      const interval = setInterval(async () => {
        try {
          const freshData = await fetchLiveMatchesInternal();
          controller.enqueue(
            encoder.encode(`event: update\ndata: ${JSON.stringify(freshData)}\n\n`)
          );
        } catch (err) {
          // Keep SSE connection open on transient API hiccups
        }
      }, 12000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
