import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getSpeciesBySlug } from "@/data/catalog";
import { markPriceFromRecord } from "@/lib/pricing";
import { mmkvStorage } from "@/store/mmkv";

export type StarterId = "bulbasaur" | "charmander" | "squirtle";

export type LedgerEntryType = "purchase" | "prize" | "sale";

export type LedgerEntry = {
  id: string;
  type: LedgerEntryType;
  /** Signed cash delta: purchases negative, prizes/sales positive. */
  amount: number;
  balanceAfter: number;
  title: string;
  subtitle: string;
  round: number;
  createdAt: string;
};

export type BattleRecord = {
  id: string;
  round: number;
  ownedId: string;
  challengerSlug: string;
  challengerName: string;
  won: boolean;
  prizeMoney: number;
};

export type CashHistoryEntry = {
  round: number;
  cash: number;
};

export type OwnedPokemon = {
  id: string;
  speciesId: string;
  wins: number;
  losses: number;
  markPrice: number;
};

export type GameState = {
  starterId: StarterId;
  roundsPlayed: number;
  cash: number;
  cashHistory: CashHistoryEntry[];
  ledger: LedgerEntry[];
  battleHistory: BattleRecord[];
  purchasedListingIds: string[];
  stable: OwnedPokemon[];
};

export type ResolveBattleInput = {
  ownedId: string;
  challengerSlug: string;
  challengerName: string;
  won: boolean;
  prizeMoney: number;
};

export type PurchaseListingInput = {
  listingId: string;
  slug: string;
  name: string;
  markPrice: number;
  wins: number;
  losses: number;
};

export type PurchaseResult =
  | { ok: true; ownedId: string }
  | {
      ok: false;
      reason: "no_state" | "insufficient_funds" | "already_purchased";
    };

type GameStore = {
  state: GameState | null;
  createState: (starterId: StarterId) => void;
  clearState: () => void;
  resolveBattle: (input: ResolveBattleInput) => void;
  purchaseListing: (input: PurchaseListingInput) => PurchaseResult;
};

function createOwnedStarter(starterId: StarterId): OwnedPokemon {
  const species = getSpeciesBySlug(starterId);
  const listPrice = species?.listPrice ?? 100;

  return {
    id: `${starterId}-starter`,
    speciesId: starterId,
    wins: 0,
    losses: 0,
    markPrice: listPrice,
  };
}

function migrateOwnedPokemon(
  owned: Partial<OwnedPokemon> & Pick<OwnedPokemon, "id" | "speciesId">,
): OwnedPokemon {
  const species = getSpeciesBySlug(owned.speciesId);
  const listPrice = species?.listPrice ?? owned.markPrice ?? 100;
  const wins = owned.wins ?? 0;
  const losses = owned.losses ?? 0;

  return {
    id: owned.id,
    speciesId: owned.speciesId,
    wins,
    losses,
    markPrice:
      owned.markPrice ?? markPriceFromRecord(listPrice, wins, losses),
  };
}

function createLedgerEntry(
  partial: Omit<LedgerEntry, "id" | "createdAt"> & { id?: string },
): LedgerEntry {
  return {
    id: partial.id ?? `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: partial.type,
    amount: partial.amount,
    balanceAfter: partial.balanceAfter,
    title: partial.title,
    subtitle: partial.subtitle,
    round: partial.round,
    createdAt: new Date().toISOString(),
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: null,
      createState: (starterId) =>
        set({
          state: {
            starterId,
            roundsPlayed: 0,
            cash: 0,
            cashHistory: [{ round: 0, cash: 0 }],
            ledger: [],
            battleHistory: [],
            purchasedListingIds: [],
            stable: [createOwnedStarter(starterId)],
          },
        }),
      clearState: () =>
        set({
          state: null,
        }),
      resolveBattle: ({
        ownedId,
        challengerSlug,
        challengerName,
        won,
        prizeMoney,
      }) =>
        set((store) => {
          if (!store.state) {
            return store;
          }

          const roundsPlayed = store.state.roundsPlayed + 1;
          const awarded = won ? prizeMoney : 0;
          const cash = store.state.cash + awarded;

          const fighter = store.state.stable.find((owned) => owned.id === ownedId);
          const fighterName =
            getSpeciesBySlug(fighter?.speciesId ?? "")?.name ?? "Pokémon";

          const stable = store.state.stable.map((owned) => {
            if (owned.id !== ownedId) {
              return owned;
            }

            const wins = owned.wins + (won ? 1 : 0);
            const losses = owned.losses + (won ? 0 : 1);
            const species = getSpeciesBySlug(owned.speciesId);
            const listPrice = species?.listPrice ?? owned.markPrice;

            return {
              ...owned,
              wins,
              losses,
              markPrice: markPriceFromRecord(listPrice, wins, losses),
            };
          });

          const battle: BattleRecord = {
            id: `battle-${ownedId}-${roundsPlayed}-${Date.now()}`,
            round: roundsPlayed,
            ownedId,
            challengerSlug,
            challengerName,
            won,
            prizeMoney: awarded,
          };

          const ledger =
            awarded > 0
              ? [
                  createLedgerEntry({
                    id: `prize-${battle.id}`,
                    type: "prize",
                    amount: awarded,
                    balanceAfter: cash,
                    title: "Battle prize",
                    subtitle: `${fighterName} beat ${challengerName}`,
                    round: roundsPlayed,
                  }),
                  ...store.state.ledger,
                ]
              : store.state.ledger;

          return {
            state: {
              ...store.state,
              roundsPlayed,
              cash,
              cashHistory: [
                ...store.state.cashHistory,
                { round: roundsPlayed, cash },
              ],
              ledger,
              battleHistory: [battle, ...store.state.battleHistory],
              purchasedListingIds: [],
              stable,
            },
          };
        }),
      purchaseListing: ({
        listingId,
        slug,
        name,
        markPrice,
        wins,
        losses,
      }) => {
        const store = get();
        if (!store.state) {
          return { ok: false, reason: "no_state" };
        }

        if (store.state.purchasedListingIds.includes(listingId)) {
          return { ok: false, reason: "already_purchased" };
        }

        if (store.state.cash < markPrice) {
          return { ok: false, reason: "insufficient_funds" };
        }

        const ownedId = `${slug}-${listingId}`;
        const cash = store.state.cash - markPrice;
        const entry = createLedgerEntry({
          type: "purchase",
          amount: -markPrice,
          balanceAfter: cash,
          title: `Bought ${name}`,
          subtitle: `Market lot · Round ${store.state.roundsPlayed}`,
          round: store.state.roundsPlayed,
        });

        set({
          state: {
            ...store.state,
            cash,
            ledger: [entry, ...store.state.ledger],
            purchasedListingIds: [...store.state.purchasedListingIds, listingId],
            stable: [
              ...store.state.stable,
              {
                id: ownedId,
                speciesId: slug,
                wins,
                losses,
                markPrice,
              },
            ],
          },
        });

        return { ok: true, ownedId };
      },
    }),
    {
      name: "stablemate-game",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (store) => ({
        state: store.state,
      }),
      merge: (persisted, current) => {
        const persistedStore = persisted as Partial<GameStore> | undefined;
        const state = persistedStore?.state;

        if (!state) {
          return current;
        }

        const starterId = state.starterId;
        const cash = state.cash ?? 0;

        return {
          ...current,
          ...persistedStore,
          state: {
            ...state,
            roundsPlayed: state.roundsPlayed ?? 0,
            cash,
            cashHistory: state.cashHistory ?? [{ round: 0, cash }],
            ledger: state.ledger ?? [],
            battleHistory: state.battleHistory ?? [],
            purchasedListingIds: state.purchasedListingIds ?? [],
            stable: (state.stable ?? [createOwnedStarter(starterId)]).map(
              (owned) => migrateOwnedPokemon(owned),
            ),
          },
        };
      },
    },
  ),
);

export const useHasGameState = () =>
  useGameStore((store) => store.state !== null);

export const useRoundsPlayed = () =>
  useGameStore((store) => store.state?.roundsPlayed ?? 0);

export const useCash = () => useGameStore((store) => store.state?.cash ?? 0);

export const useLedger = () =>
  useGameStore((store) => store.state?.ledger ?? []);
