import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getSpeciesBySlug } from "@/data/catalog";
import { markPriceFromRecord } from "@/lib/pricing";
import { mmkvStorage } from "@/store/mmkv";

export type StarterId = "bulbasaur" | "charmander" | "squirtle";

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
  battleHistory: BattleRecord[];
  stable: OwnedPokemon[];
};

export type ResolveBattleInput = {
  ownedId: string;
  challengerSlug: string;
  challengerName: string;
  won: boolean;
  prizeMoney: number;
};

type GameStore = {
  state: GameState | null;
  createState: (starterId: StarterId) => void;
  clearState: () => void;
  resolveBattle: (input: ResolveBattleInput) => void;
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

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      state: null,
      createState: (starterId) =>
        set({
          state: {
            starterId,
            roundsPlayed: 0,
            cash: 0,
            cashHistory: [{ round: 0, cash: 0 }],
            battleHistory: [],
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

          return {
            state: {
              ...store.state,
              roundsPlayed,
              cash,
              cashHistory: [
                ...store.state.cashHistory,
                { round: roundsPlayed, cash },
              ],
              battleHistory: [battle, ...store.state.battleHistory],
              stable,
            },
          };
        }),
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
            battleHistory: state.battleHistory ?? [],
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
