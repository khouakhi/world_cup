/** FIFA World Cup league id in API-Football (always 1). */
export const API_FOOTBALL_LEAGUE_ID = 1;

/**
 * Season year sent to API-Football requests (live score sync only).
 *
 * Fixtures and teams come from bundled World Cup 2026 static data.
 * API-Football updates scores on those fixtures when the season is available.
 *
 * Free API-Football plans only allow seasons 2022–2024 — live 2026 sync
 * requires upgrading and setting API_FOOTBALL_SEASON=2026.
 */
export function getApiFootballSeason(): number {
  const raw = process.env.API_FOOTBALL_SEASON?.trim();
  if (raw) {
    const season = parseInt(raw, 10);
    if (!Number.isNaN(season)) return season;
  }
  return 2022;
}
