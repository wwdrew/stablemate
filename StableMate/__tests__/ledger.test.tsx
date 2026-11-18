import { act, fireEvent, screen } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useGameStore } from "@/store/game";
import { resolveBattle } from "@/store/gameState";
import { useSettingsStore } from "@/store/settings";

import {
  expectRunningBalances,
  makeListing,
  makeOwned,
  seedGame,
  setSettings,
  settleNext,
  usd,
} from "../test/fixtures";
import {
  renderApp,
  resetStores,
  withinScreenContaining,
  withinTab,
} from "../test/renderApp";

const CASH = 1000;
const gengar = makeOwned("gengar", { wins: 2 });
const onix = makeListing("onix");
const store = () => useGameStore.getState();

beforeEach(() => {
  resetStores();
  jest.useFakeTimers();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  seedGame({ cash: CASH, stable: [gengar] });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function winPrize(prizeMoney: number) {
  useGameStore.setState({
    state: resolveBattle(store().state!, {
      ownedId: "squirtle-starter",
      challengerSlug: "onix",
      challengerName: "Onix",
      won: true,
      prizeMoney,
    }),
  });
}

function buyOnix() {
  return store().purchaseListing({
    listingId: onix.id,
    slug: onix.slug,
    name: onix.name,
    markPrice: onix.markPrice,
    wins: onix.wins,
    losses: onix.losses,
  });
}

function historyTitles() {
  return withinTab("history")
    .getAllByText(/^(Battle prize|Bought \S+|Sold \S+|Refund · \S+)$/)
    .map((node) => [node.props.children].flat().join(""));
}

test("H1 · pending first, then posted activity newest-first by posting time", async () => {
  useSettingsStore.setState({ isOnline: false, settlementOutcome: "succeed" });
  winPrize(100);
  buyOnix();
  store().sellOwned(gengar.id);
  await renderApp("/history");

  // Queue is offline: both trades pending, listed above the posted prize.
  expect(historyTitles()).toEqual(["Sold Gengar", "Bought Onix", "Battle prize"]);

  await setSettings({ isOnline: true });
  await settleNext();
  await settleNext();

  // The sale posted last, so it's newest; the purchase posted when its hold was taken.
  expect(historyTitles()).toEqual(["Sold Gengar", "Bought Onix", "Battle prize"]);
  expect(withinTab("history").queryByText(/· Pending/)).not.toBeOnTheScreen();
});

test("H1 · a sale that settles after a prize moves above it", async () => {
  useSettingsStore.setState({ isOnline: false, settlementOutcome: "succeed" });
  store().sellOwned(gengar.id);
  winPrize(100);
  await renderApp("/history");

  expect(historyTitles()).toEqual(["Sold Gengar", "Battle prize"]);

  await setSettings({ isOnline: true });
  await settleNext();

  expect(historyTitles()).toEqual(["Sold Gengar", "Battle prize"]);
  expect(store().state!.ledger.map((entry) => entry.type)).toEqual(["sale", "prize"]);
  expectRunningBalances(CASH);
});

test("H2 · running balances stay consistent across every kind of movement", async () => {
  await renderApp("/history");

  // Settled purchase, failed purchase (refund), settled sale, failed sale, prize.
  await setSettings({ settlementOutcome: "succeed" });
  await act(() => buyOnix());
  await settleNext();

  await setSettings({ settlementOutcome: "fail" });
  await act(() =>
    store().purchaseListing({
      listingId: "round-0-94-1",
      slug: "gengar",
      name: "Gengar",
      markPrice: 300,
      wins: 0,
      losses: 0,
    }),
  );
  await settleNext();

  await act(() => store().sellOwned(gengar.id));
  await settleNext();

  await setSettings({ settlementOutcome: "succeed" });
  await act(() => store().sellOwned(gengar.id));
  await settleNext();

  await act(() => winPrize(150));

  expect(store().state!.ledger.map((entry) => `${entry.type}:${entry.status}`)).toEqual([
    "prize:settled",
    "sale:settled",
    "sale:failed",
    "refund:settled",
    "purchase:failed",
    "purchase:settled",
  ]);
  expectRunningBalances(CASH);
  expect(withinTab("history").getByText("6 transactions")).toBeOnTheScreen();
  expect(withinTab("history").getByText(`${usd(store().state!.cash)}`)).toBeOnTheScreen();
});

describe("H4 · receipts", () => {
  async function openReceipt(title: string) {
    await fireEvent.press(withinTab("history").getByText(title));
    expect(await screen.findByText("Reference")).toBeOnTheScreen();
    return withinScreenContaining("Reference");
  }

  test("a pending sale credits on settlement", async () => {
    useSettingsStore.setState({ isOnline: false });
    store().sellOwned(gengar.id);
    await renderApp("/history");

    const receipt = await openReceipt("Sold Gengar");

    expect(receipt.getByText("Pending")).toBeOnTheScreen();
    expect(receipt.getByText("Credits on settlement")).toBeOnTheScreen();
    expect(receipt.getByText("Sale placed")).toBeOnTheScreen();
    expect(receipt.getByText("Waiting for a buyer")).toBeOnTheScreen();
    expect(receipt.getByText("Settles when you’re back online.")).toBeOnTheScreen();
    expect(receipt.getByText("Sale settled")).toBeOnTheScreen();
    // Steps that haven't happened say so, not just with a hollow dot.
    expect(receipt.getByLabelText(/^Waiting for a buyer, In progress\./)).toBeOnTheScreen();
    expect(receipt.getByLabelText("Sale settled, Not yet")).toBeOnTheScreen();
    expect(receipt.getByText(`+${usd(gengar.markPrice)}`)).toBeOnTheScreen();
    expect(receipt.getByText("Market sale · Round 0")).toBeOnTheScreen();
  });

  test("a failed purchase shows the reason and the balance after its hold", async () => {
    useSettingsStore.setState({ settlementOutcome: "fail" });
    await renderApp("/history");
    await act(() => buyOnix());
    await settleNext();

    const receipt = await openReceipt("Bought Onix");

    expect(receipt.getByText("Failed")).toBeOnTheScreen();
    expect(receipt.getByText("Funds held")).toBeOnTheScreen();
    expect(receipt.getByText("Purchase failed")).toBeOnTheScreen();
    expect(receipt.getByText("Sold out before your order cleared")).toBeOnTheScreen();
    expect(receipt.getByText("Refunded")).toBeOnTheScreen();
    expect(receipt.getByText(`${usd(CASH - onix.markPrice)}`)).toBeOnTheScreen();
    const entry = store().state!.ledger.find((item) => item.type === "purchase")!;
    expect(receipt.getByText(entry.id)).toBeOnTheScreen();
  });

  test("a prize is settled with its balance", async () => {
    winPrize(120);
    await renderApp("/history");

    const receipt = await openReceipt("Battle prize");

    expect(receipt.getByText("Prize")).toBeOnTheScreen();
    expect(receipt.getByText("Settled")).toBeOnTheScreen();
    expect(receipt.getByText("Prize paid")).toBeOnTheScreen();
    expect(receipt.getByText("+$120")).toBeOnTheScreen();
    expect(receipt.getByText(`${usd(CASH + 120)}`)).toBeOnTheScreen();
    expect(receipt.getByText("Squirtle beat Onix")).toBeOnTheScreen();
  });
});

test("H8 · a failed purchase's receipt links to its refund", async () => {
  useSettingsStore.setState({ settlementOutcome: "fail" });
  await renderApp("/history");
  await act(() => buyOnix());
  await settleNext();

  await fireEvent.press(withinTab("history").getByText("Bought Onix"));
  await fireEvent.press(await screen.findByText("View receipt"));

  const refund = withinScreenContaining("Refund issued");
  expect(refund.getByText("Refund · Onix")).toBeOnTheScreen();
  expect(refund.getByText(`${usd(onix.markPrice)} back in your wallet.`)).toBeOnTheScreen();
});

test("H5 · a receipt for a missing entry says so", async () => {
  await renderApp("/history/missing");

  expect(screen.getByText("Transaction not found")).toBeOnTheScreen();
});

test("H6 · filters show open, settled and failed entries", async () => {
  // A settled prize, a failed purchase with its refund, and a pending sale.
  useSettingsStore.setState({ settlementOutcome: "fail" });
  winPrize(100);
  buyOnix();
  await renderApp("/history");
  await settleNext();
  await setSettings({ isOnline: false });
  await act(() => {
    store().sellOwned(gengar.id);
  });

  const history = withinTab("history");
  const filter = async (label: string) =>
    fireEvent.press(history.getByRole("button", { name: label }));

  expect(historyTitles()).toEqual([
    "Sold Gengar",
    "Refund · Onix",
    "Bought Onix",
    "Battle prize",
  ]);

  await filter("Open");
  expect(historyTitles()).toEqual(["Sold Gengar"]);

  await filter("Settled");
  expect(historyTitles()).toEqual(["Refund · Onix", "Battle prize"]);

  await filter("Failed");
  expect(historyTitles()).toEqual(["Bought Onix"]);

  // The balance card still covers everything.
  expect(history.getByText("4 transactions")).toBeOnTheScreen();
});

test("H7 · an empty filter says so", async () => {
  winPrize(100);
  await renderApp("/history");

  await fireEvent.press(withinTab("history").getByRole("button", { name: "Failed" }));

  expect(withinTab("history").getByText("No failed transactions.")).toBeOnTheScreen();
  expect(withinTab("history").queryByText("Battle prize")).not.toBeOnTheScreen();
});
