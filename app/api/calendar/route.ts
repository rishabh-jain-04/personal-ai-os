import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getTodayCalendarEvents,
  GoogleCalendarError,
} from "@/services/googleCalendar";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || session.error) {
    return Response.json(
      {
        error:
          session?.error === "RefreshAccessTokenError"
            ? "Session expired — sign out and sign in again"
            : "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const data = await getTodayCalendarEvents(session.accessToken);
    return Response.json(data);
  } catch (error) {
    const status =
      error instanceof GoogleCalendarError ? error.status : 502;
    const message =
      error instanceof Error ? error.message : "Failed to load calendar";

    console.error("[api/calendar]", message);

    return Response.json(
      { error: message, items: [] },
      { status: status === 401 ? 401 : 502 }
    );
  }
}
