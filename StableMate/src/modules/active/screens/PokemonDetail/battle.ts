import { getCatalogSpecies } from "@/data/catalog";
import type { CatalogSpecies } from "@/data/catalog.schema";

export function pickChallenger(excludeSlug: string): CatalogSpecies {
  const pool = getCatalogSpecies().filter(
    (species) => species.slug !== excludeSlug,
  );
  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (!pick) {
    throw new Error("No challenger available");
  }
  return pick;
}

/** Demo-biased: favour the player so battles feel good to show. */
export function rollPlayerWins(): boolean {
  return Math.random() < 0.7;
}

/** Purse scales with the challenger's list price. */
export function prizeMoneyForWin(challenger: CatalogSpecies): number {
  return Math.max(75, Math.round(challenger.listPrice * 0.22));
}
