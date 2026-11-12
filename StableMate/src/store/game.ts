import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { mmkvStorage } from "@/store/mmkv";

export type StarterId = "bulbasaur" | "charmander" | "squirtle";

export type GameState = {
  starterId: StarterId;
  roundsPlayed: number;
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
    },
  ),
);

export const useHasGameState = () =>
  useGameStore((store) => store.state !== null);
