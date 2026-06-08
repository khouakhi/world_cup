import { fetchHeadToHead } from "@/lib/api-football/client";
import {
  generateMatchPreview,
  buildFallbackPreview,
} from "@/lib/grok/client";
import {
  listUpcomingMatchesWithinHours,
  previewExists,
  saveMatchPreview,
} from "@/lib/db";

const PREVIEW_HOURS_AHEAD = 48;

export async function generateUpcomingPreviews(): Promise<{ generated: number }> {
  const upcoming = await listUpcomingMatchesWithinHours(PREVIEW_HOURS_AHEAD);
  if (!upcoming.length) return { generated: 0 };

  let generated = 0;

  for (const match of upcoming) {
    if (await previewExists(match.id)) continue;

    let preview = null;

    if (process.env.XAI_API_KEY) {
      const h2h = await fetchHeadToHead(match.home_team_id, match.away_team_id);
      preview = await generateMatchPreview(
        match.home_team_name,
        match.away_team_name,
        match.venue,
        match.stage,
        h2h
      );
    }

    if (!preview) {
      preview = buildFallbackPreview(
        match.home_team_name,
        match.away_team_name,
        match.venue,
        match.stage
      );
    }

    await saveMatchPreview(match.id, preview.preview_text, preview.fun_fact);
    generated += 1;
  }

  return { generated };
}
