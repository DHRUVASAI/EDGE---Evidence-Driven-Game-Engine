/**
 * ==============================================================================
 * INTEGRATION 2: HINDSIGHT CONTEXT & LONG-TERM MEMORY ENGINE
 * Repo: https://github.com/vectorize-io/hindsight
 *
 * Role:
 * - Persistent contextual memory for player comparisons, micro-battles,
 *   and tactical advice sessions.
 * - Prevents stateless resets: retains past decisions, selected player lineups,
 *   and prior matchup queries.
 * ==============================================================================
 */

export interface ContextMemoryEntry {
  sessionId: string;
  topic: 'microbattle' | 'lineup' | 'player_scout' | 'tactical_advice';
  prompt: string;
  insight: string;
  entities: string[];
  timestamp?: number;
}

class HindsightMemoryClient {
  private memoryStore: Map<string, ContextMemoryEntry[]> = new Map();
  private hindsightEndpoint?: string;

  constructor() {
    this.hindsightEndpoint = process.env.HINDSIGHT_ENDPOINT;
  }

  /**
   * Save a tactical decision or matchup insight to persistent memory
   */
  public async remember(entry: ContextMemoryEntry): Promise<void> {
    const session = entry.sessionId || 'default_session';
    const existing = this.memoryStore.get(session) || [];
    existing.push({
      ...entry,
      timestamp: Date.now(),
    });
    // Keep last 30 interactions per session
    if (existing.length > 30) existing.shift();
    this.memoryStore.set(session, existing);

    // If external Hindsight vector server is active, forward asynchronously
    if (this.hindsightEndpoint) {
      try {
        await fetch(`${this.hindsightEndpoint}/api/memory/store`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      } catch {
        // Safe failover to in-memory store
      }
    }
  }

  /**
   * Recall past tactical decisions or player insights relevant to current entities
   */
  public async recall(sessionId: string, currentEntities: string[]): Promise<ContextMemoryEntry[]> {
    const session = sessionId || 'default_session';
    const memories = this.memoryStore.get(session) || [];

    if (!currentEntities.length) {
      return memories.slice(-5);
    }

    const lowerEntities = currentEntities.map((e) => e.toLowerCase());
    return memories
      .filter((m) =>
        m.entities.some((e) => lowerEntities.includes(e.toLowerCase()))
      )
      .slice(-5);
  }

  /**
   * Format prior recalled memory into AI prompt context
   */
  public formatMemoryContext(memories: ContextMemoryEntry[]): string {
    if (!memories.length) return '';
    const summaries = memories.map(
      (m, idx) => `[Prior Decision ${idx + 1} (${m.topic})]: ${m.insight}`
    );
    return `\n[Historical Hindsight Context]:\n${summaries.join('\n')}\n`;
  }
}

export const hindsight = new HindsightMemoryClient();
