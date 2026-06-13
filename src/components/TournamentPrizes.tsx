import { TOURNAMENT_PRIZES } from "@/lib/copy/banter";

export function TournamentPrizes({ compact = false }: { compact?: boolean }) {
  return (
    <div className="card p-5">
      <h2 className="mb-1 text-lg font-semibold text-gold-400">🎁 What's at stake</h2>
      {!compact && (
        <p className="mb-4 text-sm text-white/55">
          Play for glory, group chat bragging rights, and these very serious prizes.
        </p>
      )}
      <div className="space-y-4">
        {TOURNAMENT_PRIZES.map((tier) => (
          <div key={tier.title}>
            <h3 className="text-sm font-semibold text-white/90">{tier.title}</h3>
            {tier.note && (
              <p className="mt-0.5 text-xs text-white/45">{tier.note}</p>
            )}
            <ul className="mt-1.5 space-y-1 text-sm text-white/65">
              {tier.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold-400/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
