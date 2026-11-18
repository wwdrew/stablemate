import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SettlementResult } from "@/api/settlement";
import type { CatalogSpecies } from "@/data/catalog.schema";
import { pickChallenger, prizeMoneyForWin, rollPlayerWins } from "@/lib/battle";
import { mmkvStorage } from "@/store/mmkv";
import type { BattleOutcome } from "@/store/settings";

import {
  applySettlement,
  type BattleRecord,
  type GameState,
  type LedgerEntry,
  newGame,
  oldestPendingId,
  type OwnedPokemon,
  purchaseListing,
  type PurchaseListingInput,
  type PurchaseResult,
  resolveBattle,
  sellOwned,
  type SellResult,
  type StarterId,
} from "./gameState";

export type * from "./gameState";

/** A battle already settled into state, for the overlay to replay. */
export type BattleResult = {
  challenger: CatalogSpecies;
  playerWins: boolean;
  prizeMoney: number;
};

type GameStore = {
  state: GameState | null;
  createState: (starterId: StarterId) => void;
  clearState: () => void;
  /** Rolls a battle and settles it immediately; `null` if the Pokémon can't fight. */
  startBattle: (ownedId: string, outcome: BattleOutcome) => BattleResult | null;
  purchaseListing: (input: PurchaseListingInput) => PurchaseResult;
  sellOwned: (ownedId: string) => SellResult;
  applySettlement: (txnId: string, result: SettlementResult) => void;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: null,
      createState: (starterId) => set({ state: newGame(starterId) }),
      clearState: () => set({ state: null }),
      startBattle: (ownedId, outcome) => {
        const state = get().state;
        const fighter = state?.stable.find((owned) => owned.id === ownedId);
        if (!state || !fighter || fighter.pending) {
          return null;
        }

        const challenger = pickChallenger(fighter.speciesId);
        const playerWins = rollPlayerWins(outcome);
        const prizeMoney = playerWins ? prizeMoneyForWin(challenger) : 0;

        // Settle before any animation runs, so quitting mid-battle can't undo it.
        set({
          state: resolveBattle(state, {
            ownedId,
            challengerSlug: challenger.slug,
            challengerName: challenger.name,
            won: playerWins,
            prizeMoney,
          }),
        });

        return { challenger, playerWins, prizeMoney };
      },
      purchaseListing: (input) => {
        const current = get().state;
        if (!current) {
          return { ok: false, reason: "no_state" };
        }
        const { result, state } = purchaseListing(current, input);
        if (state) {
          set({ state });
        }
        return result;
      },
      sellOwned: (ownedId) => {
        const current = get().state;
        if (!current) {
          return { ok: false, reason: "no_state" };
        }
        const { result, state } = sellOwned(current, ownedId);
        if (state) {
          set({ state });
        }
        return result;
      },
      applySettlement: (txnId, result) =>
        set((store) =>
          store.state ? { state: applySettlement(store.state, txnId, result) } : store,
        ),
    }),
    {
      name: "stablemate-game",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (store) => ({ state: store.state }),
    },
  ),
);

export const useHasGameState = () =>
  useGameStore((store) => store.state !== null);

export const useRoundsPlayed = () =>
  useGameStore((store) => store.state?.roundsPlayed ?? 0);

export const useCash = () => useGameStore((store) => store.state?.cash ?? 0);

// Selectors must return a stable reference when state is null, or
// useSyncExternalStore sees a new value every render and loops.
const EMPTY_LEDGER: LedgerEntry[] = [];
const EMPTY_STABLE: OwnedPokemon[] = [];
const EMPTY_BATTLE_HISTORY: BattleRecord[] = [];
const EMPTY_LISTING_IDS: string[] = [];

export const useStable = () =>
  useGameStore((store) => store.state?.stable ?? EMPTY_STABLE);

export const useBattleHistory = () =>
  useGameStore((store) => store.state?.battleHistory ?? EMPTY_BATTLE_HISTORY);

export const usePurchasedListingIds = () =>
  useGameStore((store) => store.state?.purchasedListingIds ?? EMPTY_LISTING_IDS);

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
