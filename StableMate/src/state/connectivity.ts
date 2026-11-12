import { atom, useAtom } from "jotai";

/** `true` = online, `false` = simulated offline */
export const connectivityAtom = atom(true);

export function useIsOnline() {
  return useAtom(connectivityAtom);
}
