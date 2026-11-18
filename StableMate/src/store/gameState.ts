import {
  type SettlementFailureReason,
  type SettlementResult,
  settlementFailureMessage,
} from "@/api/settlement";
import { getSpeciesBySlug } from "@/data/catalog";
import { markPriceFromRecord } from "@/lib/pricing";

/**
 * The game's state and every way it can change, as pure functions: each takes
 * a `GameState` and returns the next one. The store in `game.ts` only wires
 * these to Zustand.
 */

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
  ledger: LedgerEntry[];
  battleHistory: BattleRecord[];
  purchasedListingIds: string[];
  stable: OwnedPokemon[];
};

export type BattleInput = {
  ownedId: string;
  challengerSlug: string;
  challengerName: string;
  won: boolean;
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

/** A change that can be refused: the next state alongside the result, or just the refusal. */
type Attempt<R extends { ok: boolean }> =
  | { result: Extract<R, { ok: true }>; state: GameState }
  | { result: Extract<R, { ok: false }>; state?: undefined };

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

export function newGame(starterId: StarterId): GameState {
  return {
    starterId,
    roundsPlayed: 0,
    cash: 0,
    ledger: [],
    battleHistory: [],
    purchasedListingIds: [],
    stable: [
      {
        id: `${starterId}-starter`,
        speciesId: starterId,
        wins: 0,
        losses: 0,
        markPrice: getSpeciesBySlug(starterId)?.listPrice ?? 100,
        pending: null,
      },
    ],
  };
}

/**
 * Plays a round: updates the fighter's record and mark price, pays any prize,
 * and opens a new market lot. A missing or pending fighter changes nothing.
 */
export function resolveBattle(
  state: GameState,
  { ownedId, challengerSlug, challengerName, won, prizeMoney }: BattleInput,
): GameState {
  const fighter = state.stable.find((owned) => owned.id === ownedId);
  if (!fighter || fighter.pending) {
    return state;
  }

  const roundsPlayed = state.roundsPlayed + 1;
  const awarded = won ? prizeMoney : 0;
  const cash = state.cash + awarded;

  const stable = state.stable.map((owned) => {
    if (owned.id !== ownedId) {
      return owned;
    }

    const wins = owned.wins + (won ? 1 : 0);
    const losses = owned.losses + (won ? 0 : 1);
    const listPrice = getSpeciesBySlug(owned.speciesId)?.listPrice ?? owned.markPrice;

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
            subtitle: `${speciesName(fighter)} beat ${challengerName}`,
            round: roundsPlayed,
            ownedId,
          }),
          ...state.ledger,
        ]
      : state.ledger;

  return {
    ...state,
    roundsPlayed,
    cash,
    ledger,
    battleHistory: [battle, ...state.battleHistory],
    purchasedListingIds: [],
    stable,
  };
}

/** Holds the price and adds the Pokémon to the stable, pending settlement. */
export function purchaseListing(
  state: GameState,
  { listingId, slug, name, markPrice, wins, losses }: PurchaseListingInput,
): Attempt<PurchaseResult> {
  if (state.purchasedListingIds.includes(listingId)) {
    return { result: { ok: false, reason: "already_purchased" } };
  }

  if (state.cash < markPrice) {
    return { result: { ok: false, reason: "insufficient_funds" } };
  }

  const ownedId = `${slug}-${listingId}`;
  const cash = state.cash - markPrice;
  const entry = createLedgerEntry({
    type: "purchase",
    status: "pending",
    amount: -markPrice,
    balanceAfter: cash,
    title: `Bought ${name}`,
    subtitle: `Market lot · Round ${state.roundsPlayed}`,
    round: state.roundsPlayed,
    ownedId,
  });

  return {
    result: { ok: true, ownedId },
    state: {
      ...state,
      cash,
      ledger: [entry, ...state.ledger],
      purchasedListingIds: [...state.purchasedListingIds, listingId],
      stable: [
        ...state.stable,
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
  };
}

/** Lists a Pokémon for sale at its mark price; nothing is credited until it settles. */
export function sellOwned(state: GameState, ownedId: string): Attempt<SellResult> {
  const owned = state.stable.find((item) => item.id === ownedId);
  if (!owned) {
    return { result: { ok: false, reason: "not_found" } };
  }

  if (owned.pending) {
    return { result: { ok: false, reason: "pending" } };
  }

  // Selling the last Pokémon would leave nothing to battle with.
  const keeping = state.stable.filter(
    (item) => item.id !== ownedId && item.pending?.type !== "sale",
  );
  if (keeping.length === 0) {
    return { result: { ok: false, reason: "last_pokemon" } };
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

  return {
    result: { ok: true, txnId: entry.id },
    state: {
      ...state,
      ledger: [entry, ...state.ledger],
      stable: state.stable.map((item) =>
        item.id === ownedId ? { ...item, pending: { txnId: entry.id, type: "sale" } } : item,
      ),
    },
  };
}

/**
 * Settles a pending purchase or sale. Anything else (unknown, already settled)
 * changes nothing, so a settlement delivered twice is harmless.
 */
export function applySettlement(
  state: GameState,
  txnId: string,
  result: SettlementResult,
): GameState {
  const entry = state.ledger.find((item) => item.id === txnId);
  if (!entry || entry.status !== "pending") {
    return state;
  }

  const settledAt = new Date().toISOString();
  const replaceEntry = (next: LedgerEntry) =>
    state.ledger.map((item) => (item.id === txnId ? next : item));
  const releaseOwned = () =>
    state.stable.map((item) => (item.id === entry.ownedId ? { ...item, pending: null } : item));
  const removeOwned = () => state.stable.filter((item) => item.id !== entry.ownedId);

  if (result.ok) {
    if (entry.type === "purchase") {
      return {
        ...state,
        ledger: replaceEntry({ ...entry, status: "settled", settledAt }),
        stable: releaseOwned(),
      };
    }

    // Sale proceeds post now, so the entry moves to the top of the ledger.
    const cash = state.cash + entry.amount;
    return {
      ...state,
      cash,
      ledger: [
        { ...entry, status: "settled", settledAt, balanceAfter: cash },
        ...state.ledger.filter((item) => item.id !== txnId),
      ],
      stable: removeOwned(),
    };
  }

  const failed: LedgerEntry = {
    ...entry,
    status: "failed",
    settledAt,
    failureReason: result.reason,
  };

  if (entry.type === "sale") {
    return { ...state, ledger: replaceEntry(failed), stable: releaseOwned() };
  }

  // Release the hold with a compensating entry; history stays append-only.
  const owned = state.stable.find((item) => item.id === entry.ownedId);
  const cash = state.cash - entry.amount;
  const refund = createLedgerEntry({
    type: "refund",
    amount: -entry.amount,
    balanceAfter: cash,
    title: `Refund · ${speciesName(owned)}`,
    subtitle: settlementFailureMessage(result.reason),
    round: state.roundsPlayed,
    ownedId: entry.ownedId,
  });

  return {
    ...state,
    cash,
    ledger: [refund, ...replaceEntry(failed)],
    stable: removeOwned(),
  };
}

/** The oldest pending transaction: the head of the settlement queue. */
export function oldestPendingId(ledger: LedgerEntry[]): string | null {
  // The ledger is newest-first, so the queue head is the last pending entry.
  for (let index = ledger.length - 1; index >= 0; index -= 1) {
    const entry = ledger[index]!;
    if (entry.status === "pending") {
      return entry.id;
    }
  }
  return null;
}
