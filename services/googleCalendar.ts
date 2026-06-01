export class GoogleCalendarError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    const summary = parseGoogleErrorMessage(body) ?? responseStatusLabel(status);
    super(`Google Calendar API error (${status}): ${summary}`);
    this.name = "GoogleCalendarError";
    this.status = status;
    this.body = body;
  }
}

function responseStatusLabel(status: number): string {
  if (status === 401) {
    return "Invalid or expired access token — sign out and sign in again";
  }
  return `HTTP ${status}`;
}

function parseGoogleErrorMessage(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string };
    };
    return parsed.error?.message;
  } catch {
    return body.slice(0, 200) || undefined;
  }
}

export async function getTodayCalendarEvents(accessToken: string) {
  const now = new Date();

  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
  );
  url.searchParams.set("timeMin", startOfDay.toISOString());
  url.searchParams.set("timeMax", endOfDay.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const body = await response.text();

  if (!response.ok) {
    console.error("[Google Calendar API] request failed", {
      status: response.status,
      statusText: response.statusText,
      body: body.slice(0, 1000),
    });
    throw new GoogleCalendarError(response.status, body);
  }

  console.info("[Google Calendar API] success", {
    status: response.status,
    bytes: body.length,
  });

  try {
    return JSON.parse(body) as {
      items?: Array<{
        summary?: string;
        start?: { dateTime?: string; date?: string };
      }>;
    };
  } catch {
    console.error("[Google Calendar API] invalid JSON in success response", {
      body: body.slice(0, 500),
    });
    throw new Error("Google Calendar API returned invalid JSON");
  }
}
