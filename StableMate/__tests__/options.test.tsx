import { act, fireEvent, screen } from "@testing-library/react-native";
import { Alert, type AlertButton } from "react-native";

import { useGameStore } from "@/store/game";
import { useSettingsStore } from "@/store/settings";

import { renderApp, resetStores, withinTab } from "../test/renderApp";

beforeEach(resetStores);

afterEach(() => {
  jest.restoreAllMocks();
});

/** Presses Reset game and returns the confirmation's buttons. */
async function pressResetGame(): Promise<AlertButton[]> {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  await fireEvent.press(withinTab("options").getByText("Reset game"));

  expect(alert).toHaveBeenCalledWith(
    "Reset game?",
    "This clears your stable, cash and history. Your network setting is kept.",
    expect.any(Array),
  );
  return alert.mock.calls[0]![2]!;
}

function button(buttons: AlertButton[], text: string): AlertButton {
  return buttons.find((item) => item.text === text)!;
}

test("OP2 · resetting the game returns to onboarding and keeps the network setting", async () => {
  const consoleError = jest.spyOn(console, "error");
  useGameStore.getState().createState("squirtle");
  useSettingsStore.setState({ isOnline: false });
  await renderApp("/options");

  const buttons = await pressResetGame();
  expect(useGameStore.getState().state).not.toBeNull();
  await act(() => button(buttons, "Reset").onPress!());

  expect(await screen.findByText("StableMate")).toBeOnTheScreen();
  expect(useGameStore.getState().state).toBeNull();
  expect(useSettingsStore.getState().isOnline).toBe(false);
  // Every tab is still mounted when state goes null; selectors must not loop.
  expect(consoleError).not.toHaveBeenCalled();
});

test("OP3 · cancelling the reset keeps the game", async () => {
  useGameStore.getState().createState("squirtle");
  await renderApp("/options");

  const buttons = await pressResetGame();

  expect(button(buttons, "Cancel").style).toBe("cancel");
  expect(button(buttons, "Reset").style).toBe("destructive");
  expect(useGameStore.getState().state).not.toBeNull();
});
