import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { mmkvStorage } from "@/store/mmkv";

export type BattleOutcome = "random" | "win" | "lose";

type SettingsStore = {
  /** `true` = online, `false` = simulated offline */
  isOnline: boolean;
  /** Demo/E2E control: force battle results instead of rolling them. */
  battleOutcome: BattleOutcome;
  setIsOnline: (isOnline: boolean) => void;
  setBattleOutcome: (battleOutcome: BattleOutcome) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      isOnline: true,
      battleOutcome: "random",
      setIsOnline: (isOnline) => set({ isOnline }),
      setBattleOutcome: (battleOutcome) => set({ battleOutcome }),
    }),
    {
      name: "stablemate-settings",
      storage: createJSONStorage(() => mmkvStorage),
      // Battle outcome resets to random on launch so a forced result never
      // silently carries into a real session.
      partialize: (store) => ({ isOnline: store.isOnline }),
    },
  ),
);

export const useIsOnline = () => useSettingsStore((store) => store.isOnline);

export const useBattleOutcome = () =>
  useSettingsStore((store) => store.battleOutcome);
