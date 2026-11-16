import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  type SettlementFailureReason,
  type SettlementResult,
  settlementFailureMessage,
} from "@/api/settlement";
import { getSpeciesBySlug } from "@/data/catalog";
import type { CatalogSpecies } from "@/data/catalog.schema";
import { pickChallenger, prizeMoneyForWin, rollPlayerWins } from "@/lib/battle";
import { markPriceFromRecord } from "@/lib/pricing";
import { mmkvStorage } from "@/store/mmkv";
import type { BattleOutcome } from "@/store/settings";

export type StarterId = "bulbasaur" | "charmander" | "squirtle";

export type LedgerEntryType = "purchase" | "prize" | "sale" | "refund";

/**
 * Purchases debit cash immediately (a hold) and sit `pending` until settled;
 * a failed purchase is reversed by a separate `refund` entry. Sales credit
 * nothing until they settle, so pending proceeds can't be spent.
 */
export type TransactionStatus = "pending" | "settled" | "failed";

export type LedgerEntry = {
  id: string;
  type: LedgerEntryType;
  status: TransactionStatus;
  /** Signed cash delta: purchases negative, prizes/sales/refunds positive. */
  amount: number;
  /** Cash after this entry posted; `null` for sales that haven't credited. */
  balanceAfter: number | null;
  title: string;
  subtitle: string;
  round: number;
  createdAt: string;
  settledAt: string | null;
  failureReason: SettlementFailureReason | null;
  /** Owned Pokémon moved by this purchase or sale. */
  ownedId: string | null;
};

export type PendingTransaction = {
  txnId: string;
  type: "purchase" | "sale";
};

export type BattleRecord = {
  id: string;
  round: number;
  ownedId: string;
  challengerSlug: string;
  challengerName: string;
  won: boolean;
  prizeMoney: number;
};

export type CashHistoryEntry = {
  round: number;
  cash: number;
};

export type OwnedPokemon = {
  id: string;
  speciesId: string;
  wins: number;
  losses: number;
  markPrice: number;
  /** Set while a purchase or sale of this Pokémon is awaiting settlement. */
  pending: PendingTransaction | null;
};

export type GameState = {
  starterId: StarterId;
  roundsPlayed: number;
  cash: number;
  cashHistory: CashHistoryEntry[];
  ledger: LedgerEntry[];
  battleHistory: BattleRecord[];
  purchasedListingIds: string[];
  stable: OwnedPokemon[];
};

export type ResolveBattleInput = {
  ownedId: string;
  challengerSlug: string;
  challengerName: string;
  won: boolean;
  prizeMoney: number;
};

/** A battle already settled into state, for the overlay to replay. */
export type BattleResult = {
  challenger: CatalogSpecies;
  playerWins: boolean;
  prizeMoney: number;
};

export type PurchaseListingInput = {
  listingId: string;
  slug: string;
  name: string;
  markPrice: number;
  wins: number;
  losses: number;
};

export type PurchaseResult =
  | { ok: true; ownedId: string }
  | {
      ok: false;
      reason: "no_state" | "insufficient_funds" | "already_purchased";
    };

export type SellResult =
  | { ok: true; txnId: string }
  | {
      ok: false;
      reason: "no_state" | "not_found" | "pending" | "last_pokemon";
    };

type GameStore = {
  state: GameState | null;
  createState: (starterId: StarterId) => void;
  clearState: () => void;
  resolveBattle: (input: ResolveBattleInput) => void;
  /** Rolls a battle and settles it immediately; `null` if the Pokémon can't fight. */
  startBattle: (ownedId: string, outcome: BattleOutcome) => BattleResult | null;
  purchaseListing: (input: PurchaseListingInput) => PurchaseResult;
  sellOwned: (ownedId: string) => SellResult;
  applySettlement: (txnId: string, result: SettlementResult) => void;
};

function createOwnedStarter(starterId: StarterId): OwnedPokemon {
  const species = getSpeciesBySlug(starterId);
  const listPrice = species?.listPrice ?? 100;

  return {
    id: `${starterId}-starter`,
    speciesId: starterId,
    wins: 0,
    losses: 0,
    markPrice: listPrice,
    pending: null,
  };
}

function migrateOwnedPokemon(
  owned: Partial<OwnedPokemon> & Pick<OwnedPokemon, "id" | "speciesId">,
): OwnedPokemon {
  const species = getSpeciesBySlug(owned.speciesId);
  const listPrice = species?.listPrice ?? owned.markPrice ?? 100;
  const wins = owned.wins ?? 0;
  const losses = owned.losses ?? 0;

  return {
    id: owned.id,
    speciesId: owned.speciesId,
    wins,
    losses,
    markPrice:
      owned.markPrice ?? markPriceFromRecord(listPrice, wins, losses),
    pending: owned.pending ?? null,
  };
}

function migrateLedgerEntry(
  entry: Partial<LedgerEntry> &
    Omit<LedgerEntry, "status" | "settledAt" | "failureReason" | "ownedId">,
): LedgerEntry {
  return {
    ...entry,
    status: entry.status ?? "settled",
    settledAt: entry.settledAt ?? entry.createdAt,
    failureReason: entry.failureReason ?? null,
    ownedId: entry.ownedId ?? null,
  };
}

function speciesName(owned: OwnedPokemon | undefined): string {
  return getSpeciesBySlug(owned?.speciesId ?? "")?.name ?? "Pokémon";
}

function createLedgerEntry(
  partial: Pick<
    LedgerEntry,
    "type" | "amount" | "balanceAfter" | "title" | "subtitle" | "round"
  > &
    Partial<Pick<LedgerEntry, "id" | "status" | "ownedId">>,
): LedgerEntry {
  const createdAt = new Date().toISOString();
  const status = partial.status ?? "settled";

  return {
    id: partial.id ?? `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: partial.type,
    status,
    amount: partial.amount,
    balanceAfter: partial.balanceAfter,
    title: partial.title,
    subtitle: partial.subtitle,
    round: partial.round,
    createdAt,
    settledAt: status === "settled" ? createdAt : null,
    failureReason: null,
    ownedId: partial.ownedId ?? null,
  };
}

function oldestPendingId(ledger: LedgerEntry[]): string | null {
  // Ledger is newest-first, so the queue head is the last pending entry.
  for (let index = ledger.length - 1; index >= 0; index -= 1) {
    const entry = ledger[index]!;
    if (entry.status === "pending") {
      return entry.id;
    }
  }
  return null;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: null,
      createState: (starterId) =>
        set({
          state: {
            starterId,
            roundsPlayed: 0,
            cash: 0,
            cashHistory: [{ round: 0, cash: 0 }],
            ledger: [],
            battleHistory: [],
            purchasedListingIds: [],
            stable: [createOwnedStarter(starterId)],
          },
        }),
      clearState: () =>
        set({
          state: null,
        }),
      resolveBattle: ({
        ownedId,
        challengerSlug,
        challengerName,
        won,
        prizeMoney,
      }) =>
        set((store) => {
          if (!store.state) {
            return store;
          }

          const roundsPlayed = store.state.roundsPlayed + 1;
          const awarded = won ? prizeMoney : 0;
          const cash = store.state.cash + awarded;

          const fighter = store.state.stable.find((owned) => owned.id === ownedId);
          if (!fighter || fighter.pending) {
            return store;
          }

          const fighterName = speciesName(fighter);

          const stable = store.state.stable.map((owned) => {
            if (owned.id !== ownedId) {
              return owned;
            }

            const wins = owned.wins + (won ? 1 : 0);
            const losses = owned.losses + (won ? 0 : 1);
            const species = getSpeciesBySlug(owned.speciesId);
            const listPrice = species?.listPrice ?? owned.markPrice;

            return {
              ...owned,
              wins,
              losses,
              markPrice: markPriceFromRecord(listPrice, wins, losses),
            };
          });

          const battle: BattleRecord = {
            id: `battle-${ownedId}-${roundsPlayed}-${Date.now()}`,
            round: roundsPlayed,
            ownedId,
            challengerSlug,
            challengerName,
            won,
            prizeMoney: awarded,
          };

          const ledger =
            awarded > 0
              ? [
                  createLedgerEntry({
                    id: `prize-${battle.id}`,
                    type: "prize",
                    amount: awarded,
                    balanceAfter: cash,
                    title: "Battle prize",
                    subtitle: `${fighterName} beat ${challengerName}`,
                    round: roundsPlayed,
                    ownedId,
                  }),
                  ...store.state.ledger,
                ]
              : store.state.ledger;

          return {
            state: {
              ...store.state,
              roundsPlayed,
              cash,
              cashHistory: [
                ...store.state.cashHistory,
                { round: roundsPlayed, cash },
              ],
              ledger,
              battleHistory: [battle, ...store.state.battleHistory],
              purchasedListingIds: [],
              stable,
            },
          };
        }),
      startBattle: (ownedId, outcome) => {
        const fighter = get().state?.stable.find((owned) => owned.id === ownedId);
        if (!fighter || fighter.pending) {
          return null;
        }

        const challenger = pickChallenger(fighter.speciesId);
        const playerWins = rollPlayerWins(outcome);
        const prizeMoney = playerWins ? prizeMoneyForWin(challenger) : 0;

        // Settle before any animation runs, so quitting mid-battle can't undo it.
        get().resolveBattle({
          ownedId,
          challengerSlug: challenger.slug,
          challengerName: challenger.name,
          won: playerWins,
          prizeMoney,
        });

        return { challenger, playerWins, prizeMoney };
      },
      purchaseListing: ({
        listingId,
        slug,
        name,
        markPrice,
        wins,
        losses,
      }) => {
        const store = get();
        if (!store.state) {
          return { ok: false, reason: "no_state" };
        }

        if (store.state.purchasedListingIds.includes(listingId)) {
          return { ok: false, reason: "already_purchased" };
        }

        if (store.state.cash < markPrice) {
          return { ok: false, reason: "insufficient_funds" };
        }

        const ownedId = `${slug}-${listingId}`;
        const cash = store.state.cash - markPrice;
        const entry = createLedgerEntry({
          type: "purchase",
          status: "pending",
          amount: -markPrice,
          balanceAfter: cash,
          title: `Bought ${name}`,
          subtitle: `Market lot · Round ${store.state.roundsPlayed}`,
          round: store.state.roundsPlayed,
          ownedId,
        });

        set({
          state: {
            ...store.state,
            cash,
            ledger: [entry, ...store.state.ledger],
            purchasedListingIds: [...store.state.purchasedListingIds, listingId],
            stable: [
              ...store.state.stable,
              {
                id: ownedId,
                speciesId: slug,
                wins,
                losses,
                markPrice,
                pending: { txnId: entry.id, type: "purchase" },
              },
            ],
          },
        });

        return { ok: true, ownedId };
      },
      sellOwned: (ownedId) => {
        const state = get().state;
        if (!state) {
          return { ok: false, reason: "no_state" };
        }

        const owned = state.stable.find((item) => item.id === ownedId);
        if (!owned) {
          return { ok: false, reason: "not_found" };
        }

        if (owned.pending) {
          return { ok: false, reason: "pending" };
        }

        // Selling the last Pokémon would leave nothing to battle with.
        const keeping = state.stable.filter(
          (item) => item.id !== ownedId && item.pending?.type !== "sale",
        );
        if (keeping.length === 0) {
          return { ok: false, reason: "last_pokemon" };
        }

        const entry = createLedgerEntry({
          type: "sale",
          status: "pending",
          amount: owned.markPrice,
          balanceAfter: null,
          title: `Sold ${speciesName(owned)}`,
          subtitle: `Market sale · Round ${state.roundsPlayed}`,
          round: state.roundsPlayed,
          ownedId,
        });

        set({
          state: {
            ...state,
            ledger: [entry, ...state.ledger],
            stable: state.stable.map((item) =>
              item.id === ownedId
                ? { ...item, pending: { txnId: entry.id, type: "sale" } }
                : item,
            ),
          },
        });

        return { ok: true, txnId: entry.id };
      },
      applySettlement: (txnId, result) =>
        set((store) => {
          const state = store.state;
          const entry = state?.ledger.find((item) => item.id === txnId);
          if (!state || !entry || entry.status !== "pending") {
            return store;
          }

          const settledAt = new Date().toISOString();
          const owned = state.stable.find((item) => item.id === entry.ownedId);
          const otherEntries = state.ledger.filter((item) => item.id !== txnId);
          const failed: LedgerEntry = {
            ...entry,
            status: "failed",
            settledAt,
            failureReason: result.ok ? null : result.reason,
          };

          if (entry.type === "purchase") {
            if (result.ok) {
              return {
                state: {
                  ...state,
                  ledger: state.ledger.map((item) =>
                    item.id === txnId
                      ? { ...item, status: "settled", settledAt }
                      : item,
                  ),
                  stable: state.stable.map((item) =>
                    item.id === entry.ownedId ? { ...item, pending: null } : item,
                  ),
                },
              };
            }

            // Release the hold with a compensating entry; history stays append-only.
            const cash = state.cash - entry.amount;
            const refund = createLedgerEntry({
              type: "refund",
              amount: -entry.amount,
              balanceAfter: cash,
              title: `Refund · ${speciesName(owned)}`,
              subtitle: settlementFailureMessage(failed.failureReason!),
              round: state.roundsPlayed,
              ownedId: entry.ownedId,
            });

            return {
              state: {
                ...state,
                cash,
                ledger: [
                  refund,
                  ...state.ledger.map((item) => (item.id === txnId ? failed : item)),
                ],
                stable: state.stable.filter((item) => item.id !== entry.ownedId),
              },
            };
          }

          if (result.ok) {
            // Sale proceeds post now, so the entry moves to the top of the ledger.
            const cash = state.cash + entry.amount;
            return {
              state: {
                ...state,
                cash,
                ledger: [
                  { ...entry, status: "settled", settledAt, balanceAfter: cash },
                  ...otherEntries,
                ],
                stable: state.stable.filter((item) => item.id !== entry.ownedId),
              },
            };
          }

          return {
            state: {
              ...state,
              ledger: state.ledger.map((item) => (item.id === txnId ? failed : item)),
              stable: state.stable.map((item) =>
                item.id === entry.ownedId ? { ...item, pending: null } : item,
              ),
            },
          };
        }),
    }),
    {
      name: "stablemate-game",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (store) => ({
        state: store.state,
      }),
      merge: (persisted, current) => {
        const persistedStore = persisted as Partial<GameStore> | undefined;
        const state = persistedStore?.state;

        if (!state) {
          return current;
        }

        const starterId = state.starterId;
        const cash = state.cash ?? 0;

        return {
          ...current,
          ...persistedStore,
          state: {
            ...state,
            roundsPlayed: state.roundsPlayed ?? 0,
            cash,
            cashHistory: state.cashHistory ?? [{ round: 0, cash }],
            ledger: (state.ledger ?? []).map((entry) =>
              migrateLedgerEntry(entry),
            ),
            battleHistory: state.battleHistory ?? [],
            purchasedListingIds: state.purchasedListingIds ?? [],
            stable: (state.stable ?? [createOwnedStarter(starterId)]).map(
              (owned) => migrateOwnedPokemon(owned),
            ),
          },
        };
      },
    },
  ),
);

export const useHasGameState = () =>
  useGameStore((store) => store.state !== null);

export const useRoundsPlayed = () =>
  useGameStore((store) => store.state?.roundsPlayed ?? 0);

export const useCash = () => useGameStore((store) => store.state?.cash ?? 0);

const EMPTY_LEDGER: LedgerEntry[] = [];

export const useLedger = () =>
  useGameStore((store) => store.state?.ledger ?? EMPTY_LEDGER);

export const useLedgerEntry = (id: string | undefined) =>
  useGameStore((store) => store.state?.ledger.find((entry) => entry.id === id));

/** Oldest pending transaction — the head of the settlement queue. */
export const useNextPendingTransactionId = () =>
  useGameStore((store) =>
    store.state ? oldestPendingId(store.state.ledger) : null,
  );

/** Sale proceeds awaiting settlement — not yet spendable. */
export const usePendingCredits = () =>
  useGameStore((store) =>
    (store.state?.ledger ?? EMPTY_LEDGER)
      .filter((entry) => entry.status === "pending" && entry.type === "sale")
      .reduce((sum, entry) => sum + entry.amount, 0),
  );

/** Cash + Σ mark price. Pending sales stay in the stable at their locked price until they clear. */
export const useNetWorth = () =>
  useGameStore((store) =>
    store.state
      ? store.state.stable.reduce(
          (sum, owned) => sum + owned.markPrice,
          store.state.cash,
        )
      : 0,
  );
