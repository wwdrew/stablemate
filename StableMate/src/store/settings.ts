import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { mmkvStorage } from "@/store/mmkv";

export type BattleOutcome = "random" | "win" | "lose";

export type SettlementOutcome = "random" | "succeed" | "fail";

type SettingsStore = {
  /** `true` = online, `false` = simulated offline */
  isOnline: boolean;
  /** Demo/E2E control: force battle results instead of rolling them. */
  battleOutcome: BattleOutcome;
  /** Demo/E2E control: force pending transactions to settle or fail. */
  settlementOutcome: SettlementOutcome;
  setIsOnline: (isOnline: boolean) => void;
  setBattleOutcome: (battleOutcome: BattleOutcome) => void;
  setSettlementOutcome: (settlementOutcome: SettlementOutcome) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      isOnline: true,
      battleOutcome: "random",
      settlementOutcome: "random",
      setIsOnline: (isOnline) => set({ isOnline }),
      setBattleOutcome: (battleOutcome) => set({ battleOutcome }),
      setSettlementOutcome: (settlementOutcome) => set({ settlementOutcome }),
    }),
    {
      name: "stablemate-settings",
      storage: createJSONStorage(() => mmkvStorage),
      // Overrides reset to random on launch so a forced result never
      // silently carries into a real session.
      partialize: (store) => ({ isOnline: store.isOnline }),
    },
  ),
);

export const useIsOnline = () => useSettingsStore((store) => store.isOnline);

export const useBattleOutcome = () =>
  useSettingsStore((store) => store.battleOutcome);

export const useSettlementOutcome = () =>
  useSettingsStore((store) => store.settlementOutcome);
