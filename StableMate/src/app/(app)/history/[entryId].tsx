import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

import { receiptTimeline } from "@/lib/timeline";
import { detailScreenHeaderOptions } from "@/modules/active/navigation/headerOptions";
import { ReceiptScreen } from "@/modules/active/screens/Receipt/Receipt.screen";
import { useLedger, useLedgerEntry } from "@/store/game";
import { useIsOnline } from "@/store/settings";
import { useColors } from "@/theme/colors";

export default function HistoryEntryRoute() {
  const colors = useColors();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const entry = useLedgerEntry(entryId);
  const ledger = useLedger();
  const isOnline = useIsOnline();
  const timeline = useMemo(
    () => (entry ? receiptTimeline(entry, ledger, isOnline) : []),
    [entry, ledger, isOnline],
  );

  return (
    <>
      <Stack.Screen options={detailScreenHeaderOptions("Receipt", colors)} />
      <ReceiptScreen entry={entry} timeline={timeline} />
    </>
  );
}
