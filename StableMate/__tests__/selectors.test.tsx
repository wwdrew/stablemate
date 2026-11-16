import { render, renderHook, screen } from "@testing-library/react-native";

import { StableScreen } from "@/modules/active/screens/Stable/Stable.screen";
import {
  useBattleHistory,
  useGameStore,
  useLedger,
  usePurchasedListingIds,
  useStable,
} from "@/store/game";

beforeEach(() => {
  useGameStore.setState({ state: null });
});

// A selector that returns a fresh [] for null state makes useSyncExternalStore
// see a new value every render: "Maximum update depth exceeded".
test.each([
  ["useStable", useStable],
  ["useLedger", useLedger],
  ["useBattleHistory", useBattleHistory],
  ["usePurchasedListingIds", usePurchasedListingIds],
])("%s returns a stable empty list when there's no game", async (_, hook) => {
  const { result, rerender } = await renderHook(() => hook());
  const first = result.current;

  await rerender({});

  expect(first).toEqual([]);
  expect(result.current).toBe(first);
});

test("a list screen renders with no game instead of looping", async () => {
  await render(<StableScreen />);

  expect(screen.getByText("Empty stable")).toBeOnTheScreen();
});
