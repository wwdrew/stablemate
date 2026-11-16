import type { LedgerEntryType, TransactionStatus } from "@/store/game";

export function formatAmount(amount: number): string {
  const absolute = Math.abs(amount);
  if (amount > 0) {
    return `+$${absolute}`;
  }
  if (amount < 0) {
    return `-$${absolute}`;
  }
  return "$0";
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
