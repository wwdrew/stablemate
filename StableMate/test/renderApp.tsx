import { screen, within } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";

import { queryClient } from "@/api/queryClient";
import { useGameStore } from "@/store/game";
import { useSettingsStore } from "@/store/settings";

export type TabName = "(overview)" | "history" | "stable" | "buy" | "options";

/** Renders the real file-based app from `src/app`. */
export function renderApp(initialUrl = "/") {
  return renderRouter("./src/app", { initialUrl });
}

/**
 * Native tabs keep every tab screen mounted, so text that appears on several
 * tabs (a starter's name, a price) must be queried within the tab under test —
 * mirroring what's actually visible on device.
 */
export function withinTab(name: TabName) {
  const [tab] = screen.container.queryAll((instance) =>
    String(instance.props.nativeID ?? "").startsWith(`expo-router-tab:${name}:`),
  );
  if (!tab) {
    throw new Error(`Tab "${name}" is not mounted`);
  }
  return within(tab);
}

/**
 * Scopes queries to the scrolling screen that contains `text`, e.g. the detail
 * modal (`"Base stats"`) rather than the list rows mounted behind it.
 */
export function withinScreenContaining(text: string | RegExp) {
  let node = screen.getByText(text);
  while (node.parent && node.type !== "RCTScrollView") {
    node = node.parent;
  }
  return within(node);
}

export function resetStores() {
  useGameStore.setState({ state: null });
  useSettingsStore.setState({
    isOnline: true,
    battleOutcome: "random",
    settlementOutcome: "random",
  });
  queryClient.clear();
}
