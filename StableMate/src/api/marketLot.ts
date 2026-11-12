import { getCatalogSpecies } from "@/data/catalog";

export type MarketListing = {
  id: string;
  round: number;
  speciesId: number;
  slug: string;
  name: string;
  types: string[];
  sprite: string | null;
  listPrice: number;
  wins: number;
  losses: number;
  markPrice: number;
};

const LOT_SIZE = 8;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = current!;
  }
  return copy;
}

function rollRecord() {
  const wins = Math.floor(Math.random() * 6);
  const losses = Math.floor(Math.random() * 6);
  return { wins, losses };
}

function markPriceFromRecord(
  listPrice: number,
  wins: number,
  losses: number,
): number {
  const delta = wins - losses;
  const multiplier = 1 + delta * 0.06;
  return Math.max(25, Math.round(listPrice * multiplier));
}

/** Generates this round's market lot. RQ caches by round so results stay stable. */
export function generateMarketLot(round: number): MarketListing[] {
  const picks = shuffle(getCatalogSpecies()).slice(0, LOT_SIZE);

  return picks.map((species, index) => {
    const { wins, losses } = rollRecord();

    return {
      id: `round-${round}-${species.id}-${index}`,
      round,
      speciesId: species.id,
      slug: species.slug,
      name: species.name,
      types: species.types,
      sprite: species.sprites.default,
      listPrice: species.listPrice,
      wins,
      losses,
      markPrice: markPriceFromRecord(species.listPrice, wins, losses),
    };
  });
}

export const marketLotQueryKey = (round: number) =>
  ["marketLot", round] as const;
