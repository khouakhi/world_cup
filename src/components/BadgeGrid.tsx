import { BADGE_LABELS, type Badge } from "@/types";
import { EMPTY_NO_BADGES } from "@/lib/copy/banter";

interface BadgeGridProps {
  badges: Badge[];
  memberNames: Map<string, string>;
}

export function BadgeGrid({ badges, memberNames }: BadgeGridProps) {
  if (!badges.length) {
    return (
      <div className="card p-8 text-center text-white/60">
        {EMPTY_NO_BADGES}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {badges.map((badge) => {
        const info = BADGE_LABELS[badge.badge_type];
        return (
          <div key={badge.id} className="card flex items-start gap-4 p-4">
            <span className="text-3xl">{info.emoji}</span>
            <div>
              <div className="font-semibold text-gold-400">{info.title}</div>
              <div className="text-sm text-white/80">
                {memberNames.get(badge.user_id) ?? "Player"}
              </div>
              <div className="mt-1 text-xs text-white/50">{info.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
