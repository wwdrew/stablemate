import { useGameStore } from "@/store/game";

const g = () => useGameStore.getState();
const s = () => g().state!;

beforeEach(() => {
  g().createState("squirtle");
  useGameStore.setState({ state: { ...s(), cash: 1000 } });
});

const buy = (id = "L1", price = 300) =>
  g().purchaseListing({ listingId: id, slug: "gengar", name: "Gengar", markPrice: price, wins: 1, losses: 0 });

test("purchase places a hold and is pending", () => {
  const r = buy();
  expect(r.ok).toBe(true);
  expect(s().cash).toBe(700);
  expect(s().ledger[0]).toMatchObject({ type: "purchase", status: "pending", amount: -300, balanceAfter: 700 });
  expect(s().stable.at(-1)!.pending?.type).toBe("purchase");
});

test("hold prevents overspending", () => {
  buy("L1", 600);
  expect(buy("L2", 600)).toEqual({ ok: false, reason: "insufficient_funds" });
});

test("purchase settles", () => {
  buy();
  const txn = s().ledger[0]!.id;
  g().applySettlement(txn, { ok: true });
  expect(s().ledger[0]!.status).toBe("settled");
  expect(s().stable.at(-1)!.pending).toBeNull();
  expect(s().cash).toBe(700);
});

test("failed purchase refunds with a compensating entry", () => {
  const r = buy();
  const txn = s().ledger[0]!.id;
  g().applySettlement(txn, { ok: false, reason: "sold_out" });
  expect(s().cash).toBe(1000);
  expect(s().ledger[0]).toMatchObject({ type: "refund", amount: 300, balanceAfter: 1000, status: "settled" });
  expect(s().ledger[1]).toMatchObject({ type: "purchase", status: "failed", failureReason: "sold_out" });
  expect(s().stable.find((o) => r.ok && o.id === r.ownedId)).toBeUndefined();
});

test("cannot sell last pokemon or a pending one", () => {
  expect(g().sellOwned("squirtle-starter")).toEqual({ ok: false, reason: "last_pokemon" });
  const r = buy();
  if (!r.ok) throw new Error("purchase rejected");
  expect(g().sellOwned(r.ownedId)).toEqual({ ok: false, reason: "pending" });
});

test("sale is pending with no credit, then settles to top of ledger", () => {
  const r = buy();
  if (!r.ok) throw new Error("purchase rejected");
  g().applySettlement(s().ledger[0]!.id, { ok: true });
  // a prize posts between sale request and settlement
  const sale = g().sellOwned(r.ownedId);
  if (!sale.ok) throw new Error("sale rejected");
  expect(s().cash).toBe(700);
  expect(s().ledger[0]).toMatchObject({ type: "sale", status: "pending", amount: 300, balanceAfter: null });
  expect(g().sellOwned("squirtle-starter")).toEqual({ ok: false, reason: "last_pokemon" });
  g().resolveBattle({ ownedId: "squirtle-starter", challengerSlug: "onix", challengerName: "Onix", won: true, prizeMoney: 100 });
  expect(s().cash).toBe(800);
  g().applySettlement(sale.txnId, { ok: true });
  expect(s().cash).toBe(1100);
  expect(s().ledger[0]).toMatchObject({ id: sale.txnId, status: "settled", balanceAfter: 1100 });
  expect(s().stable.map((o) => o.id)).toEqual(["squirtle-starter"]);
});

test("failed sale rolls back without moving cash", () => {
  const r = buy();
  if (!r.ok) throw new Error("purchase rejected");
  g().applySettlement(s().ledger[0]!.id, { ok: true });
  const sale = g().sellOwned(r.ownedId);
  if (!sale.ok) throw new Error("sale rejected");
  g().applySettlement(sale.txnId, { ok: false, reason: "no_buyers" });
  expect(s().cash).toBe(700);
  expect(s().ledger[0]).toMatchObject({ status: "failed", failureReason: "no_buyers", balanceAfter: null });
  expect(s().stable.find((o) => o.id === r.ownedId)!.pending).toBeNull();
});

test("pending pokemon cannot battle; settlement is idempotent", () => {
  const r = buy();
  if (!r.ok) throw new Error("purchase rejected");
  const before = s();
  g().resolveBattle({ ownedId: r.ownedId, challengerSlug: "onix", challengerName: "Onix", won: true, prizeMoney: 100 });
  expect(s()).toBe(before);
  const txn = s().ledger[0]!.id;
  g().applySettlement(txn, { ok: false, reason: "sold_out" });
  g().applySettlement(txn, { ok: false, reason: "sold_out" });
  expect(s().cash).toBe(1000);
  expect(s().ledger.filter((e) => e.type === "refund")).toHaveLength(1);
});

test("V8: every posted entry balanceAfter is consistent newest-first", () => {
  const r = buy();
  if (!r.ok) throw new Error("purchase rejected");
  g().applySettlement(s().ledger[0]!.id, { ok: true });
  expect(s().ledger.find((e) => e.balanceAfter !== null)!.balanceAfter).toBe(s().cash);
});
