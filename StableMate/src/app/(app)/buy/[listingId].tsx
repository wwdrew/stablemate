import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useMarketLot } from "@/api/useMarketLot";
import { detailScreenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { BuyAction } from "@/modules/active/screens/PokemonDetail/BuyAction";
import { PokemonDetailScreen } from "@/modules/active/screens/PokemonDetail/PokemonDetail.screen";
import { pokemonFromListing } from "@/modules/active/screens/PokemonDetail/pokemonInstance";

export default function BuyListingDetailRoute() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { data: listings = [], isPending } = useMarketLot();

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

  if (!pokemon) {
    return (
      <>
        <Stack.Screen options={detailScreenHeaderOptions("Not found")} />
        <View style={styles.centered}>
          <Text style={styles.title}>Listing unavailable</Text>
          <Text style={styles.body}>
            This market lot entry isn’t in the current round cache.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={detailScreenHeaderOptions(pokemon.name)} />
      <PokemonDetailScreen pokemon={pokemon} actions={<BuyAction />} />
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
