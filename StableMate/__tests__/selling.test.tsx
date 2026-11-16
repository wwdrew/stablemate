import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";

import { useGameStore } from "@/store/game";
import { useSettingsStore } from "@/store/settings";

import {
  expectRunningBalances,
  makeOwned,
  seedGame,
  setSettings,
  settleNext,
} from "../test/fixtures";
import { renderApp, resetStores, withinTab } from "../test/renderApp";

const gengar = makeOwned("gengar", { wins: 2 });
const price = gengar.markPrice;
const STARTER_PRICE = 433;
const CASH = 500;

beforeEach(() => {
  resetStores();
  jest.useFakeTimers();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function sellGengar() {
  seedGame({ cash: CASH, stable: [gengar] });
  await renderApp(`/stable/${gengar.id}`);
  await fireEvent.press(screen.getByRole("button", { name: `Sell · $${price}` }));
}

test("S1 · you can't sell your last Pokémon", async () => {
  seedGame();
  await renderApp("/stable/squirtle-starter");

  expect(screen.getByText("You can’t sell your last Pokémon.")).toBeOnTheScreen();
  expect(
    screen.getByRole("button", { name: `Sell · $${STARTER_PRICE}` }),
  ).toBeDisabled();
});

test("S2 · a sale stays pending without crediting, then settles into cash", async () => {
  useSettingsStore.setState({ settlementOutcome: "succeed" });
  const netWorth = CASH + STARTER_PRICE + price;

  await sellGengar();

  // Optimistic: back on the list, marked as selling, proceeds not yet spendable.
  expect(withinTab("stable").getByText("Selling · pending")).toBeOnTheScreen();
  const overview = withinTab("(overview)");
  expect(overview.getByText(`$${CASH}`)).toBeOnTheScreen();
  expect(overview.getByText(`$${netWorth}`)).toBeOnTheScreen();
  expect(overview.getByText(new RegExp(`\\+\\$${price} sales pending`))).toBeOnTheScreen();

  const history = withinTab("history");
  expect(history.getByText("Sale · Pending")).toBeOnTheScreen();
  expect(history.getByText("Sold Gengar")).toBeOnTheScreen();
  expect(history.getByText(`+$${price}`)).toBeOnTheScreen();
  expect(history.getByText(`+$${price} pending from sales`)).toBeOnTheScreen();
  expect(history.queryByText(/^Bal /)).not.toBeOnTheScreen();

  await settleNext();

  expect(overview.getByText(`$${CASH + price}`)).toBeOnTheScreen();
  // Asset swapped for cash at mark price: net worth doesn't move.
  expect(overview.getByText(`$${netWorth}`)).toBeOnTheScreen();
  expect(overview.queryByText(/sales pending/)).not.toBeOnTheScreen();
  expect(withinTab("stable").getByText("1 Pokémon owned")).toBeOnTheScreen();
  expect(withinTab("stable").queryByText("Gengar")).not.toBeOnTheScreen();
  expect(history.getByText("Sale")).toBeOnTheScreen();
  expect(history.getByText(`Bal $${CASH + price}`)).toBeOnTheScreen();
  expect(history.queryByText(/pending from sales/)).not.toBeOnTheScreen();
  expect(useGameStore.getState().state!.ledger[0]).toMatchObject({
    type: "sale",
    status: "settled",
  });
  expectRunningBalances(CASH);
});

test("S3 · an offline sale queues until the network returns", async () => {
  useSettingsStore.setState({ isOnline: false, settlementOutcome: "succeed" });

  await sellGengar();
  await settleNext();
  await settleNext();
  expect(withinTab("stable").getByText("Selling · pending")).toBeOnTheScreen();
  expect(withinTab("(overview)").getByText(`$${CASH}`)).toBeOnTheScreen();

  await setSettings({ isOnline: true });
  await settleNext();

  expect(withinTab("(overview)").getByText(`$${CASH + price}`)).toBeOnTheScreen();
  expect(withinTab("stable").queryByText("Gengar")).not.toBeOnTheScreen();
  expectRunningBalances(CASH);
});

test("S4 · a failed sale puts the Pokémon back without moving cash", async () => {
  useSettingsStore.setState({ settlementOutcome: "fail" });

  await sellGengar();
  await settleNext();

  expect(Alert.alert).toHaveBeenCalledWith(
    "Sale failed",
    "No buyers at your price. Gengar is back in your stable.",
  );
  expect(withinTab("(overview)").getByText(`$${CASH}`)).toBeOnTheScreen();
  expect(withinTab("stable").getByText("Gengar")).toBeOnTheScreen();
  expect(withinTab("stable").queryByText("Selling · pending")).not.toBeOnTheScreen();
  expect(withinTab("history").getByText("Sale · Failed")).toBeOnTheScreen();

  await act(() => router.navigate(`/stable/${gengar.id}`));
  expect(screen.getByRole("button", { name: "Battle" })).toBeEnabled();
  expect(screen.getByRole("button", { name: `Sell · $${price}` })).toBeEnabled();
  expectRunningBalances(CASH);
});

test("S5 · a Pokémon being sold doesn't count towards keeping one", async () => {
  useSettingsStore.setState({ isOnline: false });

  await sellGengar();
  await act(() => router.navigate("/stable/squirtle-starter"));

  expect(screen.getByText("You can’t sell your last Pokémon.")).toBeOnTheScreen();
  expect(
    screen.getByRole("button", { name: `Sell · $${STARTER_PRICE}` }),
  ).toBeDisabled();
});

test("S6 · a Pokémon with a pending sale can't battle or be sold again", async () => {
  useSettingsStore.setState({ isOnline: false });

  await sellGengar();
  await act(() => router.navigate(`/stable/${gengar.id}`));

  expect(
    screen.getByText(`Sale pending at $${price}. Settles when you’re back online.`),
  ).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Battle" })).toBeDisabled();
  expect(screen.getByRole("button", { name: `Sell · $${price}` })).toBeDisabled();
});
