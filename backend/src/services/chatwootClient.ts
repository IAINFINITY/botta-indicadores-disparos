interface ChatwootConversationSummary {
  id: number;
  created_at?: number;
  updated_at?: number;
  last_activity_at?: number;
  status?: string;
  inbox_id?: number;
  meta?: {
    sender?: {
      name?: string | null;
      phone_number?: string | null;
    };
    channel?: string | null;
  };
}

interface ChatwootMessage {
  id: number;
  content?: string | null;
  processed_message_content?: string | null;
  created_at?: number;
  sender_type?: string | null;
  message_type?: number | null;
  sender?: {
    name?: string | null;
    available_name?: string | null;
    type?: string | null;
  };
}

interface ChatwootListResponse {
  data?: {
    payload?: ChatwootConversationSummary[];
  };
}

interface ChatwootMessagesResponse {
  payload?: ChatwootMessage[];
  data?: {
    payload?: ChatwootMessage[];
  };
}

interface ChatwootClientConfig {
  baseUrl: string;
  apiToken: string;
  accountId: number;
  inboxId: number;
  requestTimeoutMs: number;
}

function buildQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    params.set(key, String(value));
  }

  const raw = params.toString();
  return raw ? `?${raw}` : "";
}

export function createChatwootClient(config: ChatwootClientConfig) {
  const normalizedBaseUrl = config.baseUrl.replace(/\/$/, "");

  async function requestJson<T>(pathname: string, query: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(`${normalizedBaseUrl}${pathname}${buildQueryString(query)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        api_access_token: config.apiToken,
      },
      signal: AbortSignal.timeout(config.requestTimeoutMs),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Chatwoot ${response.status} em ${pathname}. ${body || "Resposta vazia."}`);
    }

    return (await response.json()) as T;
  }

  async function listConversationsPage(page: number): Promise<ChatwootConversationSummary[]> {
    const data = await requestJson<ChatwootListResponse>(`/api/v1/accounts/${config.accountId}/conversations`, {
      inbox_id: config.inboxId,
      status: "all",
      assignee_type: "all",
      page,
    });

    return Array.isArray(data.data?.payload) ? data.data.payload : [];
  }

  async function getConversationMessages(conversationId: number): Promise<ChatwootMessage[]> {
    const collected: ChatwootMessage[] = [];
    const seenIds = new Set<number>();
    let beforeId: number | null = null;
    let safety = 0;

    while (safety < 20) {
      safety += 1;

      const data = await requestJson<ChatwootMessagesResponse>(
        `/api/v1/accounts/${config.accountId}/conversations/${conversationId}/messages`,
        beforeId ? { before: beforeId } : {},
      );

      const batch = Array.isArray(data.payload)
        ? data.payload
        : Array.isArray(data.data?.payload)
          ? data.data.payload
          : [];

      if (batch.length === 0) {
        break;
      }

      let minBatchId = Number.POSITIVE_INFINITY;
      let appended = 0;

      for (const message of batch) {
        const id = Number(message.id || 0);
        if (id > 0) {
          if (seenIds.has(id)) {
            continue;
          }
          seenIds.add(id);
          minBatchId = Math.min(minBatchId, id);
        }

        collected.push(message);
        appended += 1;
      }

      if (appended === 0 || !Number.isFinite(minBatchId)) {
        break;
      }

      if (beforeId !== null && minBatchId >= beforeId) {
        break;
      }

      beforeId = minBatchId;
    }

    return collected;
  }

  return {
    listConversationsPage,
    getConversationMessages,
  };
}

export type { ChatwootConversationSummary, ChatwootMessage };
