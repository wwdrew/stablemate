import { useQuery } from "@tanstack/react-query";

import { generateMarketLot, marketLotQueryKey } from "@/api/marketLot";
import { usePurchasedListingIds, useRoundsPlayed } from "@/store/game";

export function useMarketLot() {
  const roundsPlayed = useRoundsPlayed();
  const purchasedListingIds = usePurchasedListingIds();

  const query = useQuery({
    queryKey: marketLotQueryKey(roundsPlayed),
    queryFn: () => generateMarketLot(roundsPlayed),
    staleTime: Infinity,
  });

  const listings = (query.data ?? []).filter(
    (listing) => !purchasedListingIds.includes(listing.id),
  );

  return {
    ...query,
    data: listings,
  };
}
