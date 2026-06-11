"use client";

import { HelpCircle, Star } from "lucide-react";
import { useState } from "react";

const EXAMPLE_ROWS = [
  { prediction: "1-1", points: 5, note: "Exact score" },
  { prediction: "0-0", points: 2, note: "Correct draw & goal difference" },
  { prediction: "2-2", points: 2, note: "Correct draw & goal difference" },
  { prediction: "2-1", points: 0, note: "Wrong result" },
  { prediction: "1-0", points: 0, note: "Wrong result" },
] as const;

/**
 * Compact scoring explainer shown on the Matches page.
 * Uses a generic Team A vs Team B example (final score 1-1).
 */
export function ScoringHelpBox() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card mb-6 overflow-hidden border-gold-400/20 bg-gold-400/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <HelpCircle className="h-4 w-4 shrink-0 text-gold-400" />
          How points work (example: Team A 1-1 Team B)
        </span>
        <span className="text-xs text-white/45">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3">
          <p className="mb-3 text-xs leading-relaxed text-white/60">
            Imagine the final score is{" "}
            <span className="font-semibold text-white/80">Team A 1-1 Team B</span>.
            Only your best tier counts per match (not stacked). Predictions lock
            15 minutes before kick-off.
          </p>

          <div className="mb-3 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-white/50">
                  <th className="px-3 py-2">You predict</th>
                  <th className="px-3 py-2">Pts</th>
                  <th className="hidden px-3 py-2 sm:table-cell">Why</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_ROWS.map((row) => (
                  <tr key={row.prediction} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2 font-mono font-medium">{row.prediction}</td>
                    <td className="px-3 py-2 font-bold text-gold-400">{row.points}</td>
                    <td className="hidden px-3 py-2 text-white/55 sm:table-cell">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="flex items-start gap-1.5 text-xs text-white/60">
            <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-gold-400 text-gold-400" />
            <span>
              <strong className="text-white/75">Captain&apos;s pick:</strong> choose one
              match per matchday. If you predict 1-1 and set it as captain, you earn{" "}
              <span className="font-semibold text-gold-400">10 pts</span> (5 × 2).
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
