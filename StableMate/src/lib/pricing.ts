/** Mark-to-market from win/loss delta — shared by market lots and owned stock. */
export function markPriceFromRecord(
  listPrice: number,
  wins: number,
  losses: number,
): number {
  const delta = wins - losses;
  const multiplier = 1 + delta * 0.06;
  return Math.max(25, Math.round(listPrice * multiplier));
}
