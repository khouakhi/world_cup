/** FIFA World Cup competition code on football-data.org */
export const FOOTBALL_DATA_WC_CODE = "WC";

/** World Cup 2026 season year (tournament year). */
export const FOOTBALL_DATA_WC_SEASON = 2026;

export function getFootballDataApiToken(): string | null {
  const token = process.env.FOOTBALL_DATA_API_TOKEN?.trim();
  return token || null;
}
