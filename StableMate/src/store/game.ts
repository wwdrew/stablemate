import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { mmkvStorage } from "@/store/mmkv";

export type StarterId = "bulbasaur" | "charmander" | "squirtle";

export type OwnedPokemon = {
  id: string;
  speciesId: StarterId;
};

export type GameState = {
  starterId: StarterId;
  roundsPlayed: number;
  stable: OwnedPokemon[];
};

type GameStore = {
  state: GameState | null;
  createState: (starterId: StarterId) => void;
  clearState: () => void;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      state: null,
      createState: (starterId) =>
        set({
          state: {
            starterId,
            roundsPlayed: 0,
            stable: [
              {
                id: `${starterId}-starter`,
                speciesId: starterId,
              },
            ],
          },
        }),
      clearState: () =>
        set({
          state: null,
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

        return {
          ...current,
          ...persistedStore,
          state: {
            ...state,
            roundsPlayed: state.roundsPlayed ?? 0,
            stable: state.stable ?? [
              {
                id: `${state.starterId}-starter`,
                speciesId: state.starterId,
              },
            ],
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
