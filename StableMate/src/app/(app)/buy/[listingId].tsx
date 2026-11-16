import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useMarketLot } from "@/api/useMarketLot";
import { detailScreenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { BuyAction } from "@/modules/active/screens/PokemonDetail/BuyAction";
import { PokemonDetailScreen } from "@/modules/active/screens/PokemonDetail/PokemonDetail.screen";
import { pokemonFromListing } from "@/modules/active/screens/PokemonDetail/pokemonInstance";
import { useCash, useGameStore } from "@/store/game";
import { useIsOnline } from "@/store/settings";

function failureReasonMessage(
  reason: "insufficient_funds" | "already_purchased" | "no_state",
  cash: number,
  price: number,
): string {
  switch (reason) {
    case "already_purchased":
      return "Already purchased this round.";
    case "no_state":
      return "Game state missing — reset from Options.";
    case "insufficient_funds": {
      const shortfall = Math.max(0, price - cash);
      return shortfall > 0
        ? `Insufficient funds — need $${shortfall} more.`
        : "Insufficient funds.";
    }
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}

function purchaseStatusMessage(args: {
  isOnline: boolean;
  cash: number;
  price: number;
  failureReason: "insufficient_funds" | "already_purchased" | "no_state" | null;
}): string | null {
  if (!args.isOnline) {
    return "You’re offline — connect to buy.";
  }

  if (args.failureReason) {
    return failureReasonMessage(args.failureReason, args.cash, args.price);
  }

  if (args.cash < args.price) {
    return failureReasonMessage("insufficient_funds", args.cash, args.price);
  }

  return null;
}

export default function BuyListingDetailRoute() {
  const router = useRouter();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { data: listings = [], isPending } = useMarketLot();
  const cash = useCash();
  const isOnline = useIsOnline();
  const purchaseListing = useGameStore((store) => store.purchaseListing);
  const [failureReason, setFailureReason] = useState<
    "insufficient_funds" | "already_purchased" | "no_state" | null
  >(null);

  const listing = listings.find((item) => item.id === listingId);
  const pokemon = listing ? pokemonFromListing(listing) : null;

  if (isPending) {
    return (
      <>
        <Stack.Screen options={detailScreenHeaderOptions("Loading")} />
        <View style={styles.centered}>
          <Text style={styles.body}>Loading…</Text>
        </View>
      </>
    );
  }

  if (!pokemon || !listing) {
    return (
      <>
        <Stack.Screen options={detailScreenHeaderOptions("Not found")} />
        <View style={styles.centered}>
          <Text style={styles.title}>Listing unavailable</Text>
          <Text style={styles.body}>
            This market lot entry isn’t for sale anymore.
          </Text>
        </View>
      </>
    );
  }

  const statusMessage = purchaseStatusMessage({
    isOnline,
    cash,
    price: listing.markPrice,
    failureReason,
  });
  const canBuy = isOnline && cash >= listing.markPrice && failureReason !== "already_purchased";

  return (
    <>
      <Stack.Screen options={detailScreenHeaderOptions(pokemon.name)} />
      <PokemonDetailScreen
        pokemon={pokemon}
        actions={
          <BuyAction
            price={listing.markPrice}
            disabled={!canBuy}
            statusMessage={statusMessage}
            onPress={() => {
              const result = purchaseListing({
                listingId: listing.id,
                slug: listing.slug,
                name: listing.name,
                markPrice: listing.markPrice,
                wins: listing.wins,
                losses: listing.losses,
              });

              if (!result.ok) {
                setFailureReason(result.reason);
                return;
              }

              setFailureReason(null);
              if (router.canGoBack()) {
                router.back();
              }
            }}
          />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 8,
    backgroundColor: "#F7F4EF",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1917",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#57534E",
  },
});
