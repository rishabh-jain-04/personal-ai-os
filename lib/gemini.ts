import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const BRIEF_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"] as const;

const BRIEF_GENERATION_CONFIG = {
  responseMimeType: "application/json",
  temperature: 0.7,
  maxOutputTokens: 512,
} as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error: Error): boolean {
  return /503|429|500|high demand|unavailable|overloaded|try again/i.test(
    error.message
  );
}

export function toUserFacingGeminiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/503|high demand|unavailable|overloaded/i.test(message)) {
    return "The AI service is busy right now. Please refresh in a moment to try again.";
  }

  if (/429|quota|rate limit/i.test(message)) {
    return "AI rate limit reached. Please wait a minute and refresh.";
  }

  if (/API key|401|403|permission/i.test(message)) {
    return "AI configuration error. Check your Gemini API key.";
  }

  return "Could not generate your daily brief. Please try again.";
}

export async function generateBriefJson(prompt: string): Promise<string> {
  let lastError: Error | undefined;

  for (const model of BRIEF_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const geminiModel = genAI.getGenerativeModel({ model });
        const result = await geminiModel.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: BRIEF_GENERATION_CONFIG,
        });

        const text = result.response.text();
        console.info("[Gemini] brief generated", { model, attempt });
        return text;
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        console.warn("[Gemini] brief attempt failed", {
          model,
          attempt,
          message: lastError.message.slice(0, 200),
        });

        if (isRetryableGeminiError(lastError) && attempt === 0) {
          await sleep(1500);
          continue;
        }

        break;
      }
    }
  }

  throw lastError ?? new Error("Failed to generate brief");
}
