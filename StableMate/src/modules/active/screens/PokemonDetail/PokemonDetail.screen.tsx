import { Image } from "expo-image";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { PokemonInstance } from "@/modules/active/screens/PokemonDetail/pokemonInstance";

type PokemonDetailScreenProps = {
  pokemon: PokemonInstance;
  actions?: ReactNode;
};

const STAT_ROWS: {
  key: keyof PokemonInstance["stats"];
  label: string;
}[] = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "specialAttack", label: "Sp. Atk" },
  { key: "specialDefense", label: "Sp. Def" },
  { key: "speed", label: "Speed" },
];

export function PokemonDetailScreen({
  pokemon,
  actions,
}: PokemonDetailScreenProps) {
  const artwork = pokemon.sprites.artwork ?? pokemon.sprites.default;
  const types = pokemon.types.join(" / ");
  const record = `${pokemon.wins}W–${pokemon.losses}L`;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.hero}>
        {artwork ? (
          <Image
            source={{ uri: artwork }}
            style={styles.artwork}
            contentFit="contain"
            accessibilityLabel={`${pokemon.name} artwork`}
          />
        ) : (
          <View style={styles.artworkFallback}>
            <Text style={styles.artworkFallbackLabel}>No art</Text>
          </View>
        )}
      </View>

      <Text style={styles.name}>{pokemon.name}</Text>
      <Text style={styles.meta}>
        {types} · {record}
      </Text>
      <Text style={styles.markPrice}>${pokemon.markPrice}</Text>

      <View style={styles.stats}>
        <Text style={styles.statsHeading}>Base stats</Text>
        {STAT_ROWS.map((row) => (
          <View key={row.key} style={styles.statRow}>
            <Text style={styles.statLabel}>{row.label}</Text>
            <Text style={styles.statValue}>{pokemon.stats[row.key]}</Text>
          </View>
        ))}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{pokemon.stats.total}</Text>
        </View>
      </View>

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#F7F4EF",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 8,
  },
  hero: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  artwork: {
    width: 220,
    height: 220,
  },
  artworkFallback: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7E5E4",
  },
  artworkFallbackLabel: {
    color: "#78716C",
    fontSize: 15,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1917",
  },
  meta: {
    fontSize: 15,
    color: "#78716C",
    textTransform: "capitalize",
  },
  markPrice: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1917",
  },
  stats: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    backgroundColor: "#FFFCF7",
    padding: 16,
    gap: 10,
  },
  statsHeading: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1917",
    marginBottom: 4,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 15,
    color: "#78716C",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1917",
  },
  actions: {
    marginTop: 24,
  },
});
