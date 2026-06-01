import type { EmailSummary } from "@/types/email";

/** Compact email context for future AI brief / reasoning */
export function emailsToPromptContext(emails: EmailSummary[]): string {
  return JSON.stringify(
    emails.map((email) => ({
      sender: email.sender,
      subject: email.subject,
      snippet: email.snippet.slice(0, 160),
      receivedAt: email.receivedAt,
    })),
    null,
    2
  );
}
