const XAI_BASE_URL = "https://api.x.ai/v1";

export interface MatchPreviewContent {
  preview_text: string;
  fun_fact: string;
}

interface GrokMessage {
  role: "system" | "user";
  content: string;
}

/**
 * Generate a short, family-friendly match preview using Grok.
 * Results are cached in the database. This is only called once per match.
 */
export async function generateMatchPreview(
  homeTeam: string,
  awayTeam: string,
  venue: string | null,
  stage: string | null,
  headToHead?: { played: number; recent_results: string[] }
): Promise<MatchPreviewContent | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;

  const h2hContext = headToHead?.played
    ? `Head-to-head: ${headToHead.played} meetings. Recent: ${headToHead.recent_results.slice(0, 3).join("; ") || "none recorded"}.`
    : "No recent head-to-head data available.";

  const messages: GrokMessage[] = [
    {
      role: "system",
      content:
        "You write brief, fun football match previews for a family prediction game. " +
        "Keep it light-hearted, under 120 words for the preview, and one surprising fun fact. " +
        "Use UK English. Return JSON only: {\"preview_text\": \"...\", \"fun_fact\": \"...\"}",
    },
    {
      role: "user",
      content:
        `Write a preview for ${homeTeam} vs ${awayTeam}. ` +
        `Stage: ${stage ?? "World Cup 2026"}. Venue: ${venue ?? "TBC"}. ${h2hContext}`,
    },
  ];

  try {
    const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages,
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("Grok API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as MatchPreviewContent;
    return {
      preview_text: parsed.preview_text,
      fun_fact: parsed.fun_fact,
    };
  } catch (error) {
    console.error("Grok preview generation failed:", error);
    return null;
  }
}

/**
 * Fallback preview when Grok is unavailable. Uses API-Football data only.
 */
export function buildFallbackPreview(
  homeTeam: string,
  awayTeam: string,
  venue: string | null,
  stage: string | null
): MatchPreviewContent {
  return {
    preview_text:
      `${homeTeam} host ${awayTeam} in this ${stage ?? "World Cup 2026"} clash` +
      (venue ? ` at ${venue}` : "") +
      ". Get your scoreline in before kick-off. Captain's pick counts double!",
    fun_fact:
      "The 2026 World Cup is the first edition with 48 teams, hosted across " +
      "USA, Mexico, and Canada.",
  };
}
