import { act } from "@testing-library/react-native";

import { type MarketListing, marketLotQueryKey } from "@/api/marketLot";
import { queryClient } from "@/api/queryClient";
import { SETTLEMENT_LATENCY_MS } from "@/api/settlement";
import { getSpeciesBySlug } from "@/data/catalog";
import { markPriceFromRecord } from "@/lib/pricing";
import { type OwnedPokemon, type StarterId, useGameStore } from "@/store/game";
import { useSettingsStore } from "@/store/settings";

/** A deterministic market listing for round 0, priced the same way the real lot is. */
export function makeListing(
  slug: string,
  { wins = 0, losses = 0, index = 0 }: { wins?: number; losses?: number; index?: number } = {},
): MarketListing {
  const species = getSpeciesBySlug(slug);
  if (!species) {
    throw new Error(`Unknown species "${slug}"`);
  }

  return {
    id: `round-0-${species.id}-${index}`,
    round: 0,
    speciesId: species.id,
    slug,
    name: species.name,
    types: species.types,
    sprite: species.sprites.default,
    listPrice: species.listPrice,
    wins,
    losses,
    markPrice: markPriceFromRecord(species.listPrice, wins, losses),
  };
}

/** Replaces this round's random lot with known listings. */
export function seedMarket(listings: MarketListing[]) {
  queryClient.setQueryData(marketLotQueryKey(0), listings);
}

/** Starts a game with `cash` already in the wallet (no ledger history). */
export function seedGame({
  starter = "squirtle",
  cash = 0,
  stable = [],
}: {
  starter?: StarterId;
  cash?: number;
  stable?: Omit<OwnedPokemon, "pending">[];
} = {}) {
  useGameStore.getState().createState(starter);
  const state = useGameStore.getState().state!;
  useGameStore.setState({
    state: {
      ...state,
      cash,
      stable: [
        ...state.stable,
        ...stable.map((owned) => ({ ...owned, pending: null })),
      ],
    },
  });
}

/** An owned, fully settled Pokémon at its record-adjusted mark price. */
export function makeOwned(
  slug: string,
  { wins = 0, losses = 0 }: { wins?: number; losses?: number } = {},
): Omit<OwnedPokemon, "pending"> {
  const species = getSpeciesBySlug(slug)!;
  return {
    id: `${slug}-owned`,
    speciesId: slug,
    wins,
    losses,
    markPrice: markPriceFromRecord(species.listPrice, wins, losses),
  };
}

/** Lets the settlement queue process its next transaction. Requires fake timers. */
export async function settleNext() {
  await act(() => jest.advanceTimersByTime(SETTLEMENT_LATENCY_MS));
}

/**
 * V8: walking posted entries oldest → newest, each `balanceAfter` equals the
 * previous balance plus its amount, and the newest equals current cash.
 */
export function expectRunningBalances(openingBalance: number) {
  const state = useGameStore.getState().state!;
  const posted = [...state.ledger]
    .reverse()
    .filter((entry) => entry.balanceAfter !== null);

  let balance = openingBalance;
  for (const entry of posted) {
    balance += entry.amount;
    expect({ id: entry.id, balanceAfter: entry.balanceAfter }).toEqual({
      id: entry.id,
      balanceAfter: balance,
    });
  }
  expect(state.cash).toBe(balance);
}

/** Changes demo settings after render (mounted screens re-render, so wrap in act). */
export async function setSettings(
  settings: Partial<ReturnType<typeof useSettingsStore.getState>>,
) {
  await act(() => useSettingsStore.setState(settings));
}

/** Expected on-screen dollars, written independently of `formatMoney`: 1234 → "$1,234". */
export function usd(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}
