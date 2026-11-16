import { useEffect } from "react";
import { Alert } from "react-native";

import {
  decideSettlement,
  SETTLEMENT_LATENCY_MS,
  settlementFailureMessage,
} from "@/api/settlement";
import { getSpeciesBySlug } from "@/data/catalog";
import { useGameStore, useNextPendingTransactionId } from "@/store/game";
import { useIsOnline, useSettingsStore } from "@/store/settings";

/**
 * Drains pending purchases and sales one at a time, oldest first, while online.
 * The queue is the persisted ledger itself, so it survives restarts; going
 * offline cancels the in-flight attempt and leaves the entry pending.
 */
export function useSettlementQueue() {
  const isOnline = useIsOnline();
  const nextTxnId = useNextPendingTransactionId();

  useEffect(() => {
    if (!isOnline || !nextTxnId) {
      return;
    }

    const timeout = setTimeout(() => {
      const { state, applySettlement } = useGameStore.getState();
      const entry = state?.ledger.find((item) => item.id === nextTxnId);
      if (!state || !entry || entry.status !== "pending") {
        return;
      }

      const type = entry.type === "sale" ? "sale" : "purchase";
      const owned = state.stable.find((item) => item.id === entry.ownedId);
      const name = getSpeciesBySlug(owned?.speciesId ?? "")?.name ?? "Pokémon";
      const result = decideSettlement(
        type,
        useSettingsStore.getState().settlementOutcome,
      );

      applySettlement(nextTxnId, result);

      if (!result.ok) {
        const reason = settlementFailureMessage(result.reason);
        if (type === "sale") {
          Alert.alert("Sale failed", `${reason}. ${name} is back in your stable.`);
        } else {
          Alert.alert(
            "Purchase failed",
            `${reason}. $${-entry.amount} has been refunded.`,
          );
        }
      }
    }, SETTLEMENT_LATENCY_MS);

    return () => clearTimeout(timeout);
  }, [isOnline, nextTxnId]);
}
