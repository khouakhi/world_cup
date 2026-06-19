import { PREDICTION_LOCK_MINUTES } from "@/types";
import type { Match } from "@/types";
import { matchdayFromKickoff } from "@/lib/utils";

const LOCK_MS = PREDICTION_LOCK_MINUTES * 60 * 1000;

/** UK calendar date for grouping fixtures and banker picks. */
export function bankerMatchdayForMatch(match: Pick<Match, "kickoff_at">): string {
  return matchdayFromKickoff(match.kickoff_at);
}

export function matchdayLockTime(kickoffAt: string): number {
  return new Date(kickoffAt).getTime() - LOCK_MS;
}

/** True once the first match on this matchday has locked (15 min rule). */
export function isBankerLockedForMatchday(matches: Match[]): boolean {
  if (!matches.length) return false;
  const earliestKickoff = Math.min(
    ...matches.map((m) => new Date(m.kickoff_at).getTime())
  );
  return Date.now() >= earliestKickoff - LOCK_MS;
}

export function earliestKickoffOnMatchday(matches: Match[]): string | null {
  if (!matches.length) return null;
  return matches.reduce((earliest, match) =>
    new Date(match.kickoff_at).getTime() < new Date(earliest.kickoff_at).getTime()
      ? match
      : earliest
  ).kickoff_at;
}
