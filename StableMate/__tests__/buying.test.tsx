import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";

import { useGameStore } from "@/store/game";
import { useSettingsStore } from "@/store/settings";

import {
  expectRunningBalances,
  makeListing,
  seedGame,
  seedMarket,
  setSettings,
  settleNext,
  usd,
} from "../test/fixtures";
import { renderApp, resetStores, withinTab } from "../test/renderApp";

const gengar = makeListing("gengar", { wins: 2, losses: 1 });
const onix = makeListing("onix", { index: 1 });
const price = gengar.markPrice;
const ownedId = `gengar-${gengar.id}`;

beforeEach(() => {
  resetStores();
  jest.useFakeTimers();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  seedMarket([gengar, onix]);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function buyGengar() {
  await renderApp(`/buy/${gengar.id}`);
  await fireEvent.press(screen.getByRole("button", { name: `Buy · ${usd(price)}` }));
}

test("P1 · insufficient funds blocks the purchase and shows the shortfall", async () => {
  seedGame({ cash: 100 });
  await renderApp(`/buy/${gengar.id}`);

  expect(
    screen.getByText(`Insufficient funds — need ${usd(price - 100)} more.`),
  ).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: `Buy · ${usd(price)}` })).toBeDisabled();
});

test("P2 · an online purchase holds funds immediately, then settles", async () => {
  useSettingsStore.setState({ settlementOutcome: "succeed" });
  seedGame({ cash: 1000 });

  await buyGengar();

  // Optimistic: modal closes, listing leaves the lot, cash is held.
  const buy = withinTab("buy");
  expect(buy.getByText(/1 for sale/)).toBeOnTheScreen();
  expect(buy.queryByText("Gengar")).not.toBeOnTheScreen();
  expect(withinTab("(overview)").getByText(`${usd(1000 - price)}`)).toBeOnTheScreen();
  expect(withinTab("stable").getByText("Buying · pending")).toBeOnTheScreen();

  const history = withinTab("history");
  expect(history.getByText("Purchase · Pending")).toBeOnTheScreen();
  expect(history.getByText("Bought Gengar")).toBeOnTheScreen();
  expect(history.getByText(`-${usd(price)}`)).toBeOnTheScreen();
  expect(history.getByText(`Bal ${usd(1000 - price)}`)).toBeOnTheScreen();

  await settleNext();

  expect(withinTab("stable").queryByText("Buying · pending")).not.toBeOnTheScreen();
  expect(history.queryByText("Purchase · Pending")).not.toBeOnTheScreen();
  expect(history.getByText("Purchase")).toBeOnTheScreen();
  // The hold became the debit — cash doesn't move again on settlement.
  expect(withinTab("(overview)").getByText(`${usd(1000 - price)}`)).toBeOnTheScreen();
  expect(useGameStore.getState().state!.stable.find((o) => o.id === ownedId)).toMatchObject({
    wins: 2,
    losses: 1,
    pending: null,
  });
  expectRunningBalances(1000);
});

test("P3 · an offline purchase queues until the network returns", async () => {
  useSettingsStore.setState({ isOnline: false, settlementOutcome: "succeed" });
  seedGame({ cash: 1000 });
  await renderApp(`/buy/${gengar.id}`);

  expect(
    screen.getByText(
      "You’re offline — funds are held now and the purchase settles when you reconnect.",
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole("button", { name: `Buy · ${usd(price)}` }));

  await settleNext();
  await settleNext();
  expect(withinTab("stable").getByText("Buying · pending")).toBeOnTheScreen();
  expect(withinTab("history").getByText("Purchase · Pending")).toBeOnTheScreen();

  await setSettings({ isOnline: true });
  await settleNext();

  expect(withinTab("stable").queryByText("Buying · pending")).not.toBeOnTheScreen();
  expect(withinTab("history").queryByText("Purchase · Pending")).not.toBeOnTheScreen();
  expectRunningBalances(1000);
});

test("P4 · a failed purchase refunds the hold with a separate entry", async () => {
  useSettingsStore.setState({ settlementOutcome: "fail" });
  seedGame({ cash: 1000 });

  await buyGengar();
  await settleNext();

  expect(Alert.alert).toHaveBeenCalledWith(
    "Purchase failed",
    `Sold out before your order cleared. ${usd(price)} has been refunded.`,
  );
  expect(withinTab("(overview)").getByText("$1,000")).toBeOnTheScreen();
  expect(withinTab("stable").queryByText("Gengar")).not.toBeOnTheScreen();
  // Sold out, so it doesn't come back to the lot.
  expect(withinTab("buy").queryByText("Gengar")).not.toBeOnTheScreen();

  const history = withinTab("history");
  expect(history.getByText("Refund")).toBeOnTheScreen();
  expect(history.getByText("Refund · Gengar")).toBeOnTheScreen();
  expect(history.getByText(`+${usd(price)}`)).toBeOnTheScreen();
  expect(history.getByText("Bal $1,000")).toBeOnTheScreen();
  expect(history.getByText("Purchase · Failed")).toBeOnTheScreen();
  expectRunningBalances(1000);
});

test("P5 · a held purchase can't be spent twice", async () => {
  seedGame({ cash: price + 100 });
  useSettingsStore.setState({ isOnline: false });

  await buyGengar();
  await fireEvent.press(screen.getByText("Onix"));

  expect(
    screen.getByText(`Insufficient funds — need ${usd(onix.markPrice - 100)} more.`),
  ).toBeOnTheScreen();
});

test("P6 · a pending purchase can't battle or be sold", async () => {
  useSettingsStore.setState({ isOnline: false });
  seedGame({ cash: 1000 });

  await buyGengar();
  // Unfocused tabs ignore touches, so switch to Stable the way a user would.
  await act(() => router.navigate(`/stable/${ownedId}`));

  expect(
    screen.getByText("Purchase pending. Settles when you’re back online."),
  ).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Battle" })).toBeDisabled();
  expect(screen.getByRole("button", { name: `Sell · ${usd(price)}` })).toBeDisabled();
});

test("P8 · queued purchases settle oldest first", async () => {
  useSettingsStore.setState({ isOnline: false, settlementOutcome: "succeed" });
  seedGame({ cash: 2000 });

  await buyGengar();
  await fireEvent.press(screen.getByText("Onix"));
  await fireEvent.press(screen.getByRole("button", { name: `Buy · ${usd(onix.markPrice)}` }));

  await setSettings({ isOnline: true });
  await settleNext();

  const pending = () =>
    useGameStore
      .getState()
      .state!.stable.filter((owned) => owned.pending)
      .map((owned) => owned.speciesId);
  expect(pending()).toEqual(["onix"]);

  await settleNext();
  expect(pending()).toEqual([]);
  expectRunningBalances(2000);
});
