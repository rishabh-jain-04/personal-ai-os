"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { DailyBrief } from "@/lib/brief";

type BriefResponse = {
  brief?: DailyBrief | null;
  ruleRecommendations?: string[];
  error?: string;
  calendarError?: string;
  weatherError?: string;
};

async function parseJsonResponse(response: Response): Promise<BriefResponse> {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text) as BriefResponse;
  } catch {
    return {};
  }
}

function BriefSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function BriefList({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="space-y-2 pl-0.5">
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 24)}`} className="flex gap-2.5 text-sm text-gray-300 leading-relaxed">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-500" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BriefContent({
  brief,
  ruleRecommendations,
}: {
  brief: DailyBrief;
  ruleRecommendations: string[];
}) {
  return (
    <div className="space-y-5">
      <p className="text-[15px] font-medium leading-snug text-white">
        {brief.greeting}
      </p>

      <p className="text-sm leading-relaxed text-gray-300">{brief.overview}</p>

      {brief.scheduleHighlights.length > 0 ? (
        <BriefSection title="Schedule">
          <BriefList items={brief.scheduleHighlights} />
        </BriefSection>
      ) : null}

      {ruleRecommendations.length > 0 ? (
        <BriefSection title="Smart tips">
          <BriefList items={ruleRecommendations} />
        </BriefSection>
      ) : null}

      {brief.recommendations.length > 0 ? (
        <BriefSection title="AI suggestions">
          <BriefList items={brief.recommendations} />
        </BriefSection>
      ) : null}
    </div>
  );
}

function BriefSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden>
      <div className="h-4 w-3/4 rounded bg-zinc-800" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-zinc-800/80" />
        <div className="h-3 w-5/6 rounded bg-zinc-800/80" />
      </div>
      <div className="h-3 w-1/3 rounded bg-zinc-800/60" />
    </div>
  );
}

export default function AIBrief() {
  const { status } = useSession();
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ruleRecommendations, setRuleRecommendations] = useState<string[]>([]);
  const [calendarWarning, setCalendarWarning] = useState<string | null>(null);
  const [weatherWarning, setWeatherWarning] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function fetchBrief() {
      setBrief(null);
      setRuleRecommendations([]);
      setErrorMessage(null);
      setCalendarWarning(null);
      setWeatherWarning(null);

      try {
        const response = await fetch("/api/ai-brief");
        const data = await parseJsonResponse(response);

        if (cancelled) return;

        if (data.calendarError) {
          setCalendarWarning(data.calendarError);
        }

        if (data.weatherError) {
          setWeatherWarning(data.weatherError);
        }

        setRuleRecommendations(data.ruleRecommendations ?? []);

        if (!response.ok) {
          setErrorMessage(
            data.ruleRecommendations?.length
              ? (data.error ?? "AI brief unavailable — smart tips still apply below.")
              : (data.error ?? "Could not load AI brief.")
          );
          return;
        }

        if (!data.brief) {
          setErrorMessage(
            data.ruleRecommendations?.length
              ? "AI brief unavailable — smart tips still apply below."
              : "No brief generated."
          );
          return;
        }

        setBrief(data.brief);
      } catch {
        if (!cancelled) {
          setErrorMessage("Could not load AI brief.");
        }
      }
    }

    fetchBrief();

    return () => {
      cancelled = true;
    };
  }, [status, retryCount]);

  if (status === "loading") {
    return <BriefSkeleton />;
  }

  if (status === "unauthenticated") {
    return (
      <p className="text-sm leading-relaxed text-gray-400">
        Sign in with Google to get a personalized daily brief.
      </p>
    );
  }

  if (brief === null && !errorMessage) {
    return <BriefSkeleton />;
  }

  const contextWarnings = [calendarWarning, weatherWarning].filter(Boolean);

  if (errorMessage && !brief && ruleRecommendations.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-gray-400">{errorMessage}</p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="text-sm text-zinc-400 underline underline-offset-2 hover:text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!brief && ruleRecommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {contextWarnings.length > 0 ? (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-200/90">
          {contextWarnings.join(" ")}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="text-sm leading-relaxed text-gray-400">{errorMessage}</p>
      ) : null}
      {brief ? (
        <BriefContent
          brief={brief}
          ruleRecommendations={ruleRecommendations}
        />
      ) : (
        <BriefSection title="Smart tips">
          <BriefList items={ruleRecommendations} />
        </BriefSection>
      )}
      {errorMessage ? (
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="text-sm text-zinc-400 underline underline-offset-2 hover:text-white"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
