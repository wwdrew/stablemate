import { useReducedMotion } from "react-native-reanimated";

/** Whether the system's Reduce Motion setting is on. Wrapped so tests can mock it. */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion();
}
