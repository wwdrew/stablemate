import { receiptTimeline } from "@/lib/timeline";
import type { LedgerEntry } from "@/store/game";

function entry(partial: Partial<LedgerEntry>): LedgerEntry {
  return {
    id: "txn",
    type: "purchase",
    status: "pending",
    amount: -400,
    balanceAfter: 600,
    title: "Bought Onix",
    subtitle: "Market lot · Round 0",
    round: 0,
    createdAt: "2026-01-01T10:00:00.000Z",
    settledAt: null,
    failureReason: null,
    ownedId: "onix-1",
    ...partial,
  };
}

const states = (steps: ReturnType<typeof receiptTimeline>) =>
  steps.map((step) => [step.title, step.state]);

test("a pending purchase is held and waiting, with settlement still to come", () => {
  const steps = receiptTimeline(entry({}), [], false);

  expect(states(steps)).toEqual([
    ["Funds held", "done"],
    ["Waiting to settle", "current"],
    ["Purchase settled", "upcoming"],
  ]);
  expect(steps[1]!.detail).toBe("Queued until you’re back online.");
  expect(receiptTimeline(entry({}), [], true)[1]!.detail).toBe("Settling now.");
});

test("a failed purchase links to its refund, and the refund links back", () => {
  const purchase = entry({
    status: "failed",
    settledAt: "2026-01-01T10:00:02.000Z",
    failureReason: "sold_out",
  });
  const refund = entry({
    id: "refund",
    type: "refund",
    status: "settled",
    amount: 400,
    balanceAfter: 1000,
    subtitle: "Sold out before your order cleared",
    createdAt: "2026-01-01T10:00:02.000Z",
  });
  const ledger = [refund, purchase];

  const purchaseSteps = receiptTimeline(purchase, ledger, true);
  expect(states(purchaseSteps)).toEqual([
    ["Funds held", "done"],
    ["Purchase failed", "failed"],
    ["Refunded", "done"],
  ]);
  expect(purchaseSteps[1]!.detail).toBe("Sold out before your order cleared");
  expect(purchaseSteps[2]!.linkedEntryId).toBe("refund");

  const refundSteps = receiptTimeline(refund, ledger, true);
  expect(states(refundSteps)).toEqual([
    ["Purchase failed", "failed"],
    ["Refund issued", "done"],
  ]);
  expect(refundSteps[0]!.linkedEntryId).toBe("txn");
});

test("sales settle or come back to the stable", () => {
  const sale = entry({ type: "sale", amount: 500, balanceAfter: null });

  expect(states(receiptTimeline({ ...sale, status: "settled" }, [], true))).toEqual([
    ["Sale placed", "done"],
    ["Sale settled", "done"],
  ]);
  expect(
    states(receiptTimeline({ ...sale, status: "failed", failureReason: "no_buyers" }, [], true)),
  ).toEqual([
    ["Sale placed", "done"],
    ["Sale failed", "failed"],
    ["Back in your stable", "done"],
  ]);
});

test("a prize is paid in one step", () => {
  expect(states(receiptTimeline(entry({ type: "prize", status: "settled" }), [], true))).toEqual([
    ["Prize paid", "done"],
  ]);
});
