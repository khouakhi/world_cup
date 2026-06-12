const UK_TIMEZONE = "Europe/London";

/**
 * Bracket submissions close at midnight at the end of Saturday 13 June 2026 (UK time),
 * i.e. 00:00 on Sunday 14 June 2026 in Europe/London (BST).
 */
export const BRACKET_SUBMISSION_DEADLINE_ISO = "2026-06-14T00:00:00+01:00";

export function getBracketSubmissionDeadline(): Date {
  return new Date(BRACKET_SUBMISSION_DEADLINE_ISO);
}

export function isBracketSubmissionOpen(now = new Date()): boolean {
  return now.getTime() < getBracketSubmissionDeadline().getTime();
}

/** User-facing deadline label (UK spelling and date style). */
export function getBracketDeadlineLabel(): string {
  return "Saturday 13 June 2026 at midnight (UK time)";
}

export function formatBracketDeadlineCountdown(now = new Date()): string | null {
  const deadline = getBracketSubmissionDeadline();
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return null;

  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} and ${hours} hour${hours === 1 ? "" : "s"} left`;
  }
  if (hours > 0) {
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours} hour${hours === 1 ? "" : "s"} and ${minutes} minute${minutes === 1 ? "" : "s"} left`;
  }

  const minutes = Math.max(1, Math.floor(ms / (60 * 1000)));
  return `${minutes} minute${minutes === 1 ? "" : "s"} left`;
}

export function formatBracketDeadlinePrecise(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(getBracketSubmissionDeadline());
}
