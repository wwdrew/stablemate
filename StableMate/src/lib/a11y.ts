import { useEffect } from "react";
import { AccessibilityInfo, useWindowDimensions } from "react-native";

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** A win–loss record as a screen reader should say it: "1 win, 2 losses". */
export function recordLabel(wins: number, losses: number): string {
  return `${plural(wins, "win", "wins")}, ${plural(losses, "loss", "losses")}`;
}

/** Display text that would wrap mid-word if it kept growing stops at this scale. */
export const DISPLAY_MAX_SCALE = 1.5;

/**
 * True at the accessibility text sizes (iOS AX1 and up), where side-by-side
 * layouts are too narrow and should stack.
 */
export function useLargeText(): boolean {
  return useWindowDimensions().fontScale >= 1.5;
}

/**
 * Reads `message` aloud on VoiceOver and TalkBack when it appears or changes,
 * for updates that happen away from where focus is.
 */
export function useAnnouncement(message: string | null | undefined) {
  useEffect(() => {
    if (message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message]);
}
