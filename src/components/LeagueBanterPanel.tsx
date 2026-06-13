import type { LeaderboardEntry } from "@/types";
import { EMPTY_BOTTOM_LEAGUE } from "@/lib/copy/banter";

interface LeagueBanterPanelProps {
  entries: LeaderboardEntry[];
}

/** Fun call-outs from data we already have. No scoring changes. */
export function LeagueBanterPanel({ entries }: LeagueBanterPanelProps) {
  if (entries.length === 0) return null;

  const mystic = [...entries].sort((a, b) => b.exact_scores - a.exact_scores)[0];
  const last = entries[entries.length - 1];

  return (
    <div className="card mb-6 space-y-3 p-4 text-sm">
      <h2 className="font-semibold text-gold-400">📣 The Banter Board</h2>
      {mystic.exact_scores > 0 && (
        <p className="text-white/70">
          🧙 <strong className="text-white/90">Mystic Meg:</strong>{" "}
          {mystic.display_name} ({mystic.exact_scores} exact score
          {mystic.exact_scores === 1 ? "" : "s"}). Annoyingly good.
        </p>
      )}
      {entries.length > 2 && last.rank === entries.length && (
        <p className="text-white/70">
          🪵 <strong className="text-white/90">Wooden Spoon FC:</strong>{" "}
          {last.display_name}. {EMPTY_BOTTOM_LEAGUE}
        </p>
      )}
      <p className="text-xs text-white/45 italic">
        This Week&apos;s Honours update after each matchday. Until then, everyone
        thinks they&apos;re Pep.
      </p>
    </div>
  );
}
