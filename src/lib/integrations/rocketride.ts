/**
 * ==============================================================================
 * INTEGRATION 1: ROCKETRIDE ORCHESTRATION CLIENT
 * Repo: https://github.com/rocketride-org/rocketride-server
 *
 * Role:
 * - Enterprise LLM orchestration, model load balancing, latency tracking,
 *   and pipeline execution.
 * - Sits in front of providers (FreeLLMAPI, Gemini, Groq, Ollama) and ensures
 *   resilience against model timeouts.
 * ==============================================================================
 */

export interface RocketRidePipelineRequest {
  pipeline: string;
  input: Record<string, any>;
  fallbackProvider?: 'gemini' | 'groq' | 'freellm';
}

export interface RocketRideExecutionResult {
  success: boolean;
  output?: string;
  latencyMs?: number;
  routedProvider?: string;
  error?: string;
}

export class RocketRideClient {
  private serverUrl: string;
  private apiKey?: string;

  constructor() {
    this.serverUrl = process.env.ROCKETRIDE_SERVER_URL || 'http://localhost:4000/api/v1';
    this.apiKey = process.env.ROCKETRIDE_API_KEY;
  }

  public isConfigured(): boolean {
    return Boolean(process.env.ROCKETRIDE_SERVER_URL);
  }

  public async executePipeline(req: RocketRidePipelineRequest): Promise<RocketRideExecutionResult> {
    const startTime = Date.now();
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'RocketRide server URL not configured. Falling back to native AI Provider.',
      };
    }

    try {
      const response = await fetch(`${this.serverUrl}/pipelines/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          pipelineName: req.pipeline,
          variables: req.input,
          fallback: req.fallbackProvider || 'gemini',
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        throw new Error(`RocketRide Server error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        output: data.result || data.text,
        latencyMs: Date.now() - startTime,
        routedProvider: data.provider || 'rocketride-managed',
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        error: err.message,
      };
    }
  }
}

export const rocketRide = new RocketRideClient();
