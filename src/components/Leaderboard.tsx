import type { LeaderboardEntry } from "@/types";
import { Crown, Medal } from "lucide-react";
import {
  EMPTY_NO_PREDICTIONS,
  LEAGUE_TABLE_FOOTER,
  rankBanter,
} from "@/lib/copy/banter";

interface PodiumProps {
  entries: LeaderboardEntry[];
}

export function Podium({ entries }: PodiumProps) {
  const [first, second, third] = entries;

  if (!first) {
    return (
      <div className="card p-8 text-center text-white/60">
        {EMPTY_NO_PREDICTIONS}
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="mb-6 text-center text-lg font-semibold text-gold-400">
        🏆 Who&apos;s Chatting Rubbish?
      </h2>
      <div className="flex items-end justify-center gap-3">
        {second && (
          <PodiumPlace entry={second} height="h-24" className="podium-2" icon={<Medal className="h-5 w-5" />} total={entries.length} />
        )}
        <PodiumPlace entry={first} height="h-32" className="podium-1" icon={<Crown className="h-6 w-6" />} total={entries.length} />
        {third && (
          <PodiumPlace entry={third} height="h-20" className="podium-3" icon={<Medal className="h-5 w-5" />} total={entries.length} />
        )}
      </div>
    </div>
  );
}

function PodiumPlace({
  entry,
  height,
  className,
  icon,
  total,
}: {
  entry: LeaderboardEntry;
  height: string;
  className: string;
  icon: React.ReactNode;
  total: number;
}) {
  const banter = rankBanter(entry.rank, total);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex flex-col items-center">
        {icon}
        <span className="mt-1 max-w-[80px] truncate text-sm font-bold">
          {entry.display_name}
        </span>
        <span className="text-xs opacity-80">{entry.total_points} pts</span>
        {banter && (
          <span className="mt-0.5 max-w-[90px] text-center text-[10px] leading-tight text-white/45">
            {banter}
          </span>
        )}
      </div>
      <div
        className={`flex w-20 items-center justify-center rounded-t-xl font-bold ${height} ${className}`}
      >
        #{entry.rank}
      </div>
    </div>
  );
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  highlightUserId?: string;
}

export function LeaderboardTable({ entries, highlightUserId }: LeaderboardTableProps) {
  const total = entries.length;

  return (
    <div className="space-y-3">
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/60">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3 text-right">Match</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Knockout</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.user_id}
                className={`border-b border-white/5 ${
                  entry.user_id === highlightUserId ? "bg-gold-400/10" : ""
                }`}
              >
                <td className="px-4 py-3 font-bold">{entry.rank}</td>
                <td className="px-4 py-3">
                  <div>{entry.display_name}</div>
                  {rankBanter(entry.rank, total) && (
                    <div className="text-[10px] text-white/40">
                      {rankBanter(entry.rank, total)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{entry.match_points}</td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  {entry.bracket_points}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gold-400">
                  {entry.total_points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-center text-xs text-white/40">{LEAGUE_TABLE_FOOTER}</p>
    </div>
  );
}
