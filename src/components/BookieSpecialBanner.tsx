"use client";

import { useMemo } from "react";
import { BOOKIE_SPECIALS } from "@/lib/copy/banter";

export function BookieSpecialBanner() {
  const line = useMemo(
    () => BOOKIE_SPECIALS[Math.floor(Math.random() * BOOKIE_SPECIALS.length)],
    []
  );

  return (
    <div className="mb-6 rounded-xl border border-gold-400/25 bg-gold-400/10 px-4 py-3 text-sm">
      <span className="font-semibold text-gold-400">🎲 Bookie&apos;s Special: </span>
      <span className="text-white/75">{line}</span>
    </div>
  );
}
