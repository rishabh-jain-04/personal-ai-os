import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTodayCalendarEvents } from "@/services/googleCalendar";
import { geminiModel } from "@/lib/gemini";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || session.error) {
    return Response.json(
      {
        error:
          session?.error === "RefreshAccessTokenError"
            ? "Session expired — sign out and sign in again"
            : "Unauthorized",
        brief: null,
      },
      { status: 401 }
    );
  }

  let events: { title?: string; start?: string }[] = [];
  let calendarError: string | undefined;

  try {
    const calendarData = await getTodayCalendarEvents(session.accessToken);
    events =
      calendarData.items?.map((event) => ({
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
      })) ?? [];
  } catch (error) {
    calendarError =
      error instanceof Error ? error.message : "Failed to load calendar";
    console.error("[api/ai-brief] calendar fetch failed", calendarError);
  }

  const prompt = `
You are an intelligent productivity assistant.

Analyze the user's schedule and generate:
- a concise daily brief
- workload observations
- productivity suggestions

Today's events:
${JSON.stringify(events, null, 2)}

Keep response under 120 words.
`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const brief = result.response.text();

    return Response.json({
      brief,
      ...(calendarError ? { calendarError } : {}),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate AI brief";
    console.error("[api/ai-brief] Gemini error", message);

    return Response.json(
      { error: message, brief: null, ...(calendarError ? { calendarError } : {}) },
      { status: 502 }
    );
  }
}
