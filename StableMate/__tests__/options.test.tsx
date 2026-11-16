import { fireEvent, screen } from "@testing-library/react-native";

import { useGameStore } from "@/store/game";
import { useSettingsStore } from "@/store/settings";

import { renderApp, resetStores, withinTab } from "../test/renderApp";

beforeEach(resetStores);

afterEach(() => {
  jest.restoreAllMocks();
});

test("OP2 · resetting the game returns to onboarding and keeps the network setting", async () => {
  const consoleError = jest.spyOn(console, "error");
  useGameStore.getState().createState("squirtle");
  useSettingsStore.setState({ isOnline: false });
  await renderApp("/options");

  await fireEvent.press(withinTab("options").getByText("Reset game"));

  expect(await screen.findByText("StableMate")).toBeOnTheScreen();
  expect(useGameStore.getState().state).toBeNull();
  expect(useSettingsStore.getState().isOnline).toBe(false);
  // Every tab is still mounted when state goes null; selectors must not loop.
  expect(consoleError).not.toHaveBeenCalled();
});
