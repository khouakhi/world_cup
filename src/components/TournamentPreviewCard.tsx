import { Calendar, CalendarDays, RefreshCw, Users } from "lucide-react";

export function TournamentPreviewCard() {
  return (
    <div className="scoreboard-glow relative overflow-hidden rounded-3xl border border-white/15 bg-black/40 p-6 backdrop-blur-xl md:p-8">
      <div className="mb-5 flex items-center gap-2 border-b border-white/10 pb-4">
        <CalendarDays className="h-5 w-5 text-gold-400" />
        <span className="text-sm font-semibold">When the tournament starts</span>
      </div>

      <ul className="space-y-4 text-sm text-white/70">
        <li className="flex gap-3">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
          <span>
            <strong className="text-white/90">Fixtures sync daily.</strong> Real
            teams, kick-off times, and results appear on your Matches page
            automatically.
          </span>
        </li>
        <li className="flex gap-3">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
          <span>
            <strong className="text-white/90">Each matchday</strong> shows that
            day&apos;s games. Browse past days anytime; nothing disappears after
            the final whistle.
          </span>
        </li>
        <li className="flex gap-3">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
          <span>
            <strong className="text-white/90">Matchday winner</strong> and the
            leaderboard update as results come in. No manual score entry needed.
          </span>
        </li>
      </ul>

      <p className="mt-5 rounded-xl bg-white/5 px-3 py-2.5 text-center text-xs text-white/45">
        11 June to 19 July 2026 · USA, Canada &amp; Mexico
      </p>
    </div>
  );
}
