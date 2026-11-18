import { Image } from "expo-image";
import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

import { formatMoney, formatSignedMoney } from "@/lib/money";
import { formatTypes, typesAndRecord } from "@/lib/pokemon";
import type { PokemonInstance } from "@/modules/active/screens/PokemonDetail/pokemonInstance";
import type { BattleRecord } from "@/store/game";
import { makeStyles } from "@/theme/colors";

type PokemonDetailScreenProps = {
  pokemon: PokemonInstance;
  battleHistory?: BattleRecord[];
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
  battleHistory,
  actions,
}: PokemonDetailScreenProps) {
  const styles = useStyles();
  const artwork = pokemon.sprites.artwork ?? pokemon.sprites.default;
  const meta = typesAndRecord(formatTypes(pokemon.types), pokemon.wins, pokemon.losses);

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

      <Text style={styles.name} accessibilityRole="header">
        {pokemon.name}
      </Text>
      <Text
        style={styles.meta}
        accessibilityLabel={meta.label}
      >
        {meta.text}
      </Text>
      <Text style={styles.markPrice}>{formatMoney(pokemon.markPrice)}</Text>

      <View style={styles.stats}>
        <Text style={styles.statsHeading} accessibilityRole="header">
          Base stats
        </Text>
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

      {battleHistory ? (
        <View style={styles.history}>
          <Text style={styles.statsHeading} accessibilityRole="header">
            Your battle history
          </Text>
          <Text style={styles.historyHint}>
            Record above can include form from before you owned them. This list
            is only battles you’ve fought.
          </Text>
          {battleHistory.length === 0 ? (
            <Text style={styles.historyEmpty}>
              No battles under your ownership yet.
            </Text>
          ) : (
            battleHistory.map((battle) => (
              <View key={battle.id} style={styles.historyRow}>
                <View style={styles.historyCopy}>
                  <Text style={styles.historyTitle}>
                    Round {battle.round} · vs {battle.challengerName}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {battle.won ? "Win" : "Loss"}
                    {battle.won ? ` · ${formatSignedMoney(battle.prizeMoney)}` : ""}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyResult,
                    battle.won ? styles.historyWin : styles.historyLoss,
                  ]}
                >
                  {battle.won ? "W" : "L"}
                </Text>
              </View>
            ))
          )}
        </View>
      ) : null}

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.separator,
  },
  artworkFallbackLabel: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  meta: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  markPrice: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  stats: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  statsHeading: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  history: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 12,
  },
  historyHint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: -4,
  },
  historyEmpty: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyCopy: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  historyMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  historyResult: {
    fontSize: 17,
    fontWeight: "700",
  },
  historyWin: {
    color: colors.positive,
  },
  historyLoss: {
    color: colors.negative,
  },
  actions: {
    marginTop: 24,
  },
}));
