import { Stack, useLocalSearchParams } from "expo-router";

import { detailScreenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { ReceiptScreen } from "@/modules/active/screens/Receipt/Receipt.screen";
import { useLedgerEntry } from "@/store/game";
import { useColors } from "@/theme/colors";

export default function HistoryEntryRoute() {
  const colors = useColors();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const entry = useLedgerEntry(entryId);

  return (
    <>
      <Stack.Screen options={detailScreenHeaderOptions("Receipt", colors)} />
      <ReceiptScreen entry={entry} />
    </>
  );
}
