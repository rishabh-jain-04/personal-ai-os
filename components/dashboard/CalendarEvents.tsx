"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface CalendarEvent {
  id: string;
  summary: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
}

export default function CalendarEvents() {
  const { status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function fetchEvents() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/calendar");
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setError(data.error ?? "Could not load calendar");
          setEvents([]);
          return;
        }

        setEvents(data.items ?? []);
      } catch {
        if (!cancelled) {
          setError("Could not load calendar");
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading" || loading) {
    return <p className="text-gray-400">Loading calendar…</p>;
  }

  if (status === "unauthenticated") {
    return (
      <p className="text-gray-400">Sign in with Google to see today&apos;s events.</p>
    );
  }

  if (error) {
    return <p className="text-gray-400">{error}</p>;
  }

  if (events.length === 0) {
    return <p className="text-gray-400">No events today.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="border border-zinc-800 rounded-xl p-3"
        >
          <p className="font-medium text-white">{event.summary}</p>
          <p className="text-sm text-gray-400 mt-1">
            {event.start?.dateTime
              ? new Date(event.start.dateTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "All day"}
          </p>
        </div>
      ))}
    </div>
  );
}
