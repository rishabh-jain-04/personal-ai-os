"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type BriefResponse = {
  brief?: string | null;
  error?: string;
  calendarError?: string;
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

export default function AIBrief() {
  const { status } = useSession();
  const [brief, setBrief] = useState<string | null>(null);
  const [calendarWarning, setCalendarWarning] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function fetchBrief() {
      setBrief(null);
      setCalendarWarning(null);

      try {
        const response = await fetch("/api/ai-brief");
        const data = await parseJsonResponse(response);

        if (cancelled) return;

        if (!response.ok) {
          setBrief(data.error ?? "Could not load AI brief.");
          return;
        }

        if (data.calendarError) {
          setCalendarWarning(data.calendarError);
        }

        setBrief(data.brief?.trim() || "No brief generated.");
      } catch {
        if (!cancelled) {
          setBrief("Could not load AI brief.");
        }
      }
    }

    fetchBrief();

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading") {
    return <p className="text-gray-300 leading-7">Loading AI brief…</p>;
  }

  if (status === "unauthenticated") {
    return (
      <p className="text-gray-300 leading-7">
        Sign in with Google to generate your AI daily brief.
      </p>
    );
  }

  if (brief === null) {
    return <p className="text-gray-300 leading-7">Loading AI brief…</p>;
  }

  return (
    <div>
      {calendarWarning ? (
        <p className="text-amber-500/90 text-sm mb-2">
          Calendar unavailable: {calendarWarning}
        </p>
      ) : null}
      <p className="text-gray-300 leading-7">{brief}</p>
    </div>
  );
}
