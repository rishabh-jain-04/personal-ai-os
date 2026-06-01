"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { EmailSummary } from "@/types/email";

type GmailResponse = {
  emails?: EmailSummary[];
  error?: string;
};

export default function ImportantEmails() {
  const { status } = useSession();
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function fetchEmails() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/gmail");
        const data = (await response.json()) as GmailResponse;

        if (cancelled) return;

        if (!response.ok) {
          setError(data.error ?? "Could not load emails");
          setEmails([]);
          return;
        }

        setEmails(data.emails ?? []);
      } catch {
        if (!cancelled) {
          setError("Could not load emails");
          setEmails([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEmails();

    return () => {
      cancelled = true;
    };
  }, [status, retryCount]);

  if (status === "loading" || loading) {
    return <p className="text-sm text-gray-400">Loading emails…</p>;
  }

  if (status === "unauthenticated") {
    return (
      <p className="text-sm text-gray-400">
        Sign in with Google to see important emails.
      </p>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-400">{error}</p>
        <button
          type="button"
          onClick={() => setRetryCount((n) => n + 1)}
          className="text-sm text-zinc-400 underline underline-offset-2 hover:text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <p className="text-sm text-gray-400">No important emails in your inbox.</p>
    );
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => (
        <div
          key={email.id}
          className="border border-zinc-800 rounded-xl p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-white truncate">
              {email.subject}
            </p>
            <time
              className="shrink-0 text-xs text-zinc-500"
              dateTime={email.receivedAt}
            >
              {email.displayTime}
            </time>
          </div>
          <p className="text-xs text-zinc-400 mt-1">{email.sender}</p>
          {email.snippet ? (
            <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">
              {email.snippet}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
