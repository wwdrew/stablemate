import type { LedgerEntryType, TransactionStatus } from "@/store/game";

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
