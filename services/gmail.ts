import type { EmailSummary } from "@/types/email";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

const EXCLUDED_LABELS = new Set([
  "CATEGORY_PROMOTIONS",
  "CATEGORY_SOCIAL",
  "CATEGORY_FORUMS",
  "SPAM",
  "TRASH",
]);

const INBOX_QUERY =
  "in:inbox newer_than:14d -category:promotions -category:social -category:forums";

export class GmailError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GmailError";
    this.status = status;
  }
}

type MessageListResponse = {
  messages?: Array<{ id: string }>;
};

type MessageResponse = {
  id: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
};

function parseSender(fromHeader: string): string {
  const trimmed = fromHeader.trim();
  const named = trimmed.match(/^(.+?)\s*<[^>]+>$/);
  if (named) {
    return named[1].replace(/^"|"$/g, "").trim();
  }
  return trimmed;
}

function getHeader(
  headers: Array<{ name: string; value: string }> | undefined,
  name: string
): string {
  const header = headers?.find(
    (entry) => entry.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value?.trim() ?? "";
}

function formatDisplayTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function shouldIncludeMessage(labelIds: string[] | undefined): boolean {
  if (!labelIds?.length) return true;
  return !labelIds.some((label) => EXCLUDED_LABELS.has(label));
}

async function gmailFetch<T>(
  accessToken: string,
  path: string,
  searchParams?: Record<string, string>
): Promise<T> {
  const url = new URL(`${GMAIL_BASE}${path}`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const body = await response.text();

  if (!response.ok) {
    let message = `Gmail API error (${response.status})`;
    try {
      const parsed = JSON.parse(body) as { error?: { message?: string } };
      if (parsed.error?.message) message = parsed.error.message;
    } catch {
      if (body) message = body.slice(0, 200);
    }

    console.error("[Gmail API] request failed", {
      path,
      status: response.status,
      message,
    });

    throw new GmailError(response.status, message);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new GmailError(502, "Gmail API returned invalid JSON");
  }
}

function mapMessageToSummary(message: MessageResponse): EmailSummary | null {
  if (!shouldIncludeMessage(message.labelIds)) {
    return null;
  }

  const headers = message.payload?.headers;
  const from = getHeader(headers, "From");
  const subject = getHeader(headers, "Subject") || "(No subject)";
  const receivedMs = Number(message.internalDate);

  if (!from || Number.isNaN(receivedMs)) {
    return null;
  }

  const receivedAt = new Date(receivedMs).toISOString();

  return {
    id: message.id,
    sender: parseSender(from),
    subject,
    snippet: (message.snippet ?? "").trim(),
    receivedAt,
    displayTime: formatDisplayTime(receivedAt),
  };
}

async function fetchMessageSummary(
  accessToken: string,
  messageId: string
): Promise<EmailSummary | null> {
  const message = await gmailFetch<MessageResponse>(
    accessToken,
    `/messages/${messageId}`,
    { format: "metadata" }
  );

  return mapMessageToSummary(message);
}

export async function getImportantEmails(
  accessToken: string,
  limit = 8
): Promise<EmailSummary[]> {
  const list = await gmailFetch<MessageListResponse>(accessToken, "/messages", {
    maxResults: String(Math.max(limit * 3, 15)),
    q: INBOX_QUERY,
  });

  const ids = list.messages?.map((message) => message.id) ?? [];
  if (ids.length === 0) {
    return [];
  }

  const candidates = await Promise.all(
    ids.map(async (id) => {
      try {
        return await fetchMessageSummary(accessToken, id);
      } catch (error) {
        console.warn("[Gmail API] skipped message", id, error);
        return null;
      }
    })
  );

  const summaries = candidates.filter(
    (summary): summary is EmailSummary => summary !== null
  );

  const top = summaries.slice(0, limit);

  console.info("[Gmail API] important emails loaded", {
    count: top.length,
  });

  return top;
}
