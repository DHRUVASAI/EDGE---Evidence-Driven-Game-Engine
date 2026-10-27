import { NextRequest } from "next/server";
import { fetchLiveMatchesInternal } from "@/lib/liveMatchesHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let pollInterval: ReturnType<typeof setInterval> | undefined;
  let heartbeatInterval: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  let inFlight = false;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | undefined;
  let lastPayload = "";

  const closeStream = () => {
    if (closed) return;
    closed = true;
    if (pollInterval) clearInterval(pollInterval);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    try {
      controllerRef?.close();
    } catch {
      // Stream may already have been closed by the runtime.
    }
  };

  const sendSnapshot = (eventName: "snapshot" | "update", data: unknown) => {
    const payload = JSON.stringify(data);
    // Do not resend the same cached snapshot every few seconds.
    if (payload === lastPayload || closed || !controllerRef) return;
    lastPayload = payload;
    try {
      controllerRef.enqueue(encoder.encode(`event: ${eventName}\ndata: ${payload}\n\n`));
    } catch {
      closeStream();
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controllerRef = controller;

      try {
        sendSnapshot("snapshot", await fetchLiveMatchesInternal());
      } catch (err) {
        console.warn("[LiveMatches SSE] Initial snapshot failed:", err);
      }

      // The provider cache controls upstream request frequency to preserve quota.
      // SSE is only the delivery channel; it cannot make provider data fresher than its cache.
      pollInterval = setInterval(async () => {
        if (inFlight || closed) return;
        inFlight = true;
        try {
          const data = await fetchLiveMatchesInternal();
          sendSnapshot("update", data);
        } catch (err) {
          // Keep the stream open on transient provider failures.
        } finally {
          inFlight = false;
        }
      }, 15_000);

      // Keep proxies from dropping an idle connection without publishing duplicate scores.
      heartbeatInterval = setInterval(() => {
        if (closed || !controllerRef) return;
        try {
          controllerRef.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          closeStream();
        }
      }, 20_000);

      req.signal.addEventListener("abort", closeStream, { once: true });
    },
    cancel() {
      closeStream();
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
