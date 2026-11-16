import { act, fireEvent, screen } from "@testing-library/react-native";

import { getSpeciesBySlug } from "@/data/catalog";
import * as battle from "@/lib/battle";
import { useGameStore } from "@/store/game";
import { useSettingsStore } from "@/store/settings";

import { usd } from "../test/fixtures";
import {
  renderApp,
  resetStores,
  withinScreenContaining,
  withinTab,
} from "../test/renderApp";

const onix = getSpeciesBySlug("onix")!;
const prize = battle.prizeMoneyForWin(onix);

beforeEach(() => {
  resetStores();
  jest.useFakeTimers();
  jest.spyOn(battle, "pickChallenger").mockReturnValue(onix);
  useGameStore.getState().createState("squirtle");
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function fightAndContinue() {
  await fireEvent.press(screen.getByText("Battle"));
  await act(() => jest.runAllTimers());
  await fireEvent.press(screen.getByText("Continue"));
}

test("B1 · a win pays the prize and records the win", async () => {
  useSettingsStore.setState({ battleOutcome: "win" });
  await renderApp("/stable/squirtle-starter");

  await fireEvent.press(screen.getByText("Battle"));
  await act(() => jest.runAllTimers());

  expect(screen.getByText("Squirtle wins")).toBeOnTheScreen();
  expect(screen.getByText(`Prize +${usd(prize)}`)).toBeOnTheScreen();
  await fireEvent.press(screen.getByText("Continue"));

  const detail = withinScreenContaining("Base stats");
  expect(detail.getByText(/1W–0L/)).toBeOnTheScreen();
  expect(detail.getByText("$459")).toBeOnTheScreen();
  expect(detail.getByText("Round 1 · vs Onix")).toBeOnTheScreen();
  expect(detail.getByText(`Win · +${usd(prize)}`)).toBeOnTheScreen();

  const overview = withinTab("(overview)");
  expect(overview.getByText(`${usd(prize)}`)).toBeOnTheScreen();
  expect(overview.getByText(`${usd(prize + 459)}`)).toBeOnTheScreen();

  const history = withinTab("history");
  expect(history.getByText("Battle prize")).toBeOnTheScreen();
  expect(history.getByText("Squirtle beat Onix")).toBeOnTheScreen();
  expect(history.getByText(`+${usd(prize)}`)).toBeOnTheScreen();
  expect(history.getByText(`Bal ${usd(prize)}`)).toBeOnTheScreen();
  expect(history.getByText("1 transaction")).toBeOnTheScreen();
});

test("B2 · a loss pays nothing and records the loss", async () => {
  useSettingsStore.setState({ battleOutcome: "lose" });
  await renderApp("/stable/squirtle-starter");

  await fightAndContinue();

  const detail = withinScreenContaining("Base stats");
  expect(detail.getByText(/0W–1L/)).toBeOnTheScreen();
  expect(detail.getByText("$407")).toBeOnTheScreen();
  expect(detail.getByText("Round 1 · vs Onix")).toBeOnTheScreen();
  expect(detail.getByText("Loss")).toBeOnTheScreen();

  const overview = withinTab("(overview)");
  expect(overview.getByText("$0")).toBeOnTheScreen();
  expect(overview.getByText("$407")).toBeOnTheScreen();
  expect(withinTab("history").getByText("No transactions yet")).toBeOnTheScreen();
});

test("B7 · the result is committed when the battle starts, not on Continue", async () => {
  useSettingsStore.setState({ battleOutcome: "lose" });
  await renderApp("/stable/squirtle-starter");

  await fireEvent.press(screen.getByText("Battle"));

  // Quitting the app mid-animation must not undo a loss.
  const state = useGameStore.getState().state!;
  expect(state.roundsPlayed).toBe(1);
  expect(state.stable[0]).toMatchObject({ wins: 0, losses: 1 });
});
