/** Pub-quiz scoring tiers — points must match src/lib/scoring.ts (5 / 2 / 1 / 0). */
export const SCORING_TIERS = [
  { points: 5, label: "🔮 Mystic Meg", prediction: "Exact score" },
  { points: 2, label: "👌 Decent Shout", prediction: "Right winner + goal difference" },
  { points: 1, label: "🍺 Jammy Git", prediction: "Right result only" },
  { points: 0, label: "🤡 Knows Nothing", prediction: "Completely wrong" },
] as const;

export const SCORING_LOCK_LINE =
  "Predictions lock 15 minutes before kick-off. No last-minute tactical edits after you've seen the line-ups, you absolute rat.";

export const CAPTAIN_PICK_NAME = "Stick Your House On It";
export const CAPTAIN_PICK_TAGLINE =
  "Pick one match each day for double points. If it comes off, you're a genius. If it doesn't, expect absolutely no sympathy.";

export const BRACKET_TITLE = "Have a Guess, Then Watch It All Go Wrong";
export const BRACKET_TAGLINE =
  "Predict the finalists and eventual winner before the knockout stages. You'll either look like a football oracle or a complete mug.";

export const LEAGUE_TABLE_TITLE = "Who's Chatting Rubbish?";
export const LEAGUE_TABLE_FOOTER =
  "⚠️ Important: The organiser reserves the right to change the rules at any time if they're not currently top of the league.";

export const EMPTY_NO_PREDICTIONS =
  "You've got the same number of points as Tottenham in a trophy parade.";

export const EMPTY_MISSED_DEADLINE =
  "Too late. VAR checked it and your prediction's been chalked off.";

export const EMPTY_BOTTOM_LEAGUE = "It's not looking good, chief.";

export const EMPTY_NO_BADGES =
  "No honours yet. Keep predicting — someone's getting a wooden spoon eventually.";

export const BOOKIE_SPECIALS = [
  "Odds of Dave forgetting to do his predictions: 1/4",
  "England to win on penalties: 50/1",
  'Someone saying "I nearly put that!": 1/50 (odds-on)',
  "Group chat blaming VAR: Guaranteed.",
  "A 90+4 equaliser ruining someone's accumulator: Nailed on.",
  'Bloke currently top of the league saying "it\'s only luck": 100%.',
  "Today's Special: 4/6 that someone complains the scoring system is unfair after dropping out of the top 3.",
] as const;

export const END_OF_TOURNAMENT_AWARDS = [
  { position: "1st", award: "🏆 Football Oracle" },
  { position: "2nd", award: "🥈 Nearly Knew Ball" },
  { position: "3rd", award: "🥉 Decent Effort" },
  { position: "Middle", award: "😐 Here for the Banter" },
  { position: "Last", award: "🪵 Wooden Spoon FC" },
] as const;

export function rankBanter(rank: number, total: number): string | null {
  if (total <= 1) return null;
  if (rank === 1) return "🏆 Football Oracle (for now)";
  if (rank === 2) return "🥈 Nearly Knew Ball";
  if (rank === 3) return "🥉 Decent Effort";
  if (rank === total) return "🪵 Wooden Spoon FC";
  return "😐 Here for the Banter";
}

export function pointsResultLabel(points: number): string {
  if (points >= 10) return "Absolute Scenes";
  if (points === 5) return "Absolute Scenes";
  if (points === 4 || points === 2) return "Decent Shout";
  if (points === 1) return "Fair Play";
  if (points === 0) return "That's Shocking";
  return "Extra Bits";
}
