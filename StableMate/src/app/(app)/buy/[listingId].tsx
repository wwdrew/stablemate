import { Stack, useLocalSearchParams } from "expo-router";

import { useMarketLot } from "@/api/useMarketLot";
import { detailScreenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { ListingDetailScreen } from "@/modules/active/screens/ListingDetail/ListingDetail.screen";
import { useColors } from "@/theme/colors";

export default function BuyListingDetailRoute() {
  const colors = useColors();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { data: listings = [], isPending } = useMarketLot();
  const listing = listings.find((item) => item.id === listingId);
  const title = isPending ? "Loading" : (listing?.name ?? "Not found");

  return (
    <>
      <Stack.Screen options={detailScreenHeaderOptions(title, colors)} />
      <ListingDetailScreen listing={listing} isLoading={isPending} />
    </>
  );
}
