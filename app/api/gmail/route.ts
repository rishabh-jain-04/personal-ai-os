import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getImportantEmails, GmailError } from "@/services/gmail";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || session.error) {
    return Response.json(
      {
        error:
          session?.error === "RefreshAccessTokenError"
            ? "Session expired — sign out and sign in again"
            : "Unauthorized",
        emails: [],
      },
      { status: 401 }
    );
  }

  try {
    const emails = await getImportantEmails(session.accessToken);
    return Response.json({ emails });
  } catch (error) {
    const status =
      error instanceof GmailError
        ? error.status === 401
          ? 401
          : 502
        : 502;

    const message =
      error instanceof Error ? error.message : "Failed to load emails";

    console.error("[api/gmail]", message);

    return Response.json({ error: message, emails: [] }, { status });
  }
}
