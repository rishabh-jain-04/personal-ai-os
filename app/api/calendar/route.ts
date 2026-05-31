import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTodayCalendarEvents } from "@/services/googleCalendar";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getTodayCalendarEvents(session.accessToken);
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load calendar";
    return Response.json({ error: message }, { status: 502 });
  }
}
