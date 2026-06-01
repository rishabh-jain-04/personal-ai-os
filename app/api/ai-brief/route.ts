import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseDailyBrief } from "@/lib/brief";
import {
  buildDailyBriefPrompt,
  gatherBriefContext,
} from "@/lib/briefContext";
import { generateBriefJson, toUserFacingGeminiError } from "@/lib/gemini";
import {
  generateRuleRecommendations,
  ruleRecommendationsToMessages,
} from "@/services/recommendations";

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

  const { context, warnings } = await gatherBriefContext(session.accessToken);
  const ruleRecommendations = ruleRecommendationsToMessages(
    generateRuleRecommendations(context)
  );

  try {
    const raw = await generateBriefJson(buildDailyBriefPrompt(context));
    const brief = parseDailyBrief(raw);

    return Response.json({
      brief,
      ruleRecommendations,
      ...(warnings.calendarError ? { calendarError: warnings.calendarError } : {}),
      ...(warnings.weatherError ? { weatherError: warnings.weatherError } : {}),
    });
  } catch (error) {
    console.error(
      "[api/ai-brief] Gemini error",
      error instanceof Error ? error.message : error
    );

    return Response.json(
      {
        error: toUserFacingGeminiError(error),
        brief: null,
        ruleRecommendations,
        ...(warnings.calendarError ? { calendarError: warnings.calendarError } : {}),
        ...(warnings.weatherError ? { weatherError: warnings.weatherError } : {}),
      },
      { status: 503 }
    );
  }
}
