import type { LedgerEntry, LedgerEntryType, TransactionStatus } from "@/store/game";

/** How a pending transaction will settle: now, or once the network is back. */
export function settlementWaitCopy(isOnline: boolean): string {
  return isOnline ? "Settling now." : "Settles when you’re back online.";
}

export function typeLabel(type: LedgerEntryType): string {
  switch (type) {
    case "purchase":
      return "Purchase";
    case "prize":
      return "Prize";
    case "sale":
      return "Sale";
    case "refund":
      return "Refund";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function statusLabel(status: TransactionStatus): string | null {
  switch (status) {
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    case "settled":
      return null;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** History filter: everything, still settling, settled, or failed. */
export type LedgerFilter = "all" | "open" | "settled" | "failed";

/**
 * Entries for a History filter. Pending entries come first (like a bank app),
 * then posted activity newest-first.
 */
export function filterLedger(
  ledger: readonly LedgerEntry[],
  filter: LedgerFilter,
): LedgerEntry[] {
  const pending = ledger.filter((entry) => entry.status === "pending");
  const posted = ledger.filter((entry) => entry.status !== "pending");

  switch (filter) {
    case "all":
      return [...pending, ...posted];
    case "open":
      return pending;
    case "settled":
      return posted.filter((entry) => entry.status === "settled");
    case "failed":
      return posted.filter((entry) => entry.status === "failed");
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}
