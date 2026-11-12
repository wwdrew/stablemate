import { useQuery } from "@tanstack/react-query";

import { generateMarketLot, marketLotQueryKey } from "@/api/marketLot";
import { useRoundsPlayed } from "@/store/game";

export function useMarketLot() {
  const roundsPlayed = useRoundsPlayed();

  return useQuery({
    queryKey: marketLotQueryKey(roundsPlayed),
    queryFn: () => generateMarketLot(roundsPlayed),
    staleTime: Infinity,
  });
}
