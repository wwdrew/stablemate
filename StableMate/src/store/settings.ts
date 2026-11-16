import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { mmkvStorage } from "@/store/mmkv";

type SettingsStore = {
  /** `true` = online, `false` = simulated offline */
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      isOnline: true,
      setIsOnline: (isOnline) => set({ isOnline }),
    }),
    {
      name: "stablemate-settings",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

export const useIsOnline = () => useSettingsStore((store) => store.isOnline);
