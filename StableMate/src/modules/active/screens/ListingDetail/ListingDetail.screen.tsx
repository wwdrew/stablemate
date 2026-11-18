import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import type { MarketListing } from "@/api/marketLot";
import { formatMoney } from "@/lib/money";
import { BuyAction } from "@/modules/active/screens/PokemonDetail/BuyAction";
import { PokemonDetailScreen } from "@/modules/active/screens/PokemonDetail/PokemonDetail.screen";
import { pokemonFromListing } from "@/modules/active/screens/PokemonDetail/pokemonInstance";
import { type PurchaseResult, useCash, useGameStore } from "@/store/game";
import { useIsOnline } from "@/store/settings";
import { makeStyles } from "@/theme/colors";

type PurchaseFailure = Extract<PurchaseResult, { ok: false }>["reason"];

type ListingDetailScreenProps = {
  listing: MarketListing | undefined;
  isLoading: boolean;
};

function failureReasonMessage(reason: PurchaseFailure, cash: number, price: number): string {
  switch (reason) {
    case "already_purchased":
      return "Already purchased this round.";
    case "no_state":
      return "Game state missing — reset from Options.";
    case "insufficient_funds": {
      const shortfall = Math.max(0, price - cash);
      return shortfall > 0
        ? `Insufficient funds — need ${formatMoney(shortfall)} more.`
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
  failureReason: PurchaseFailure | null;
}): { text: string; tone: "error" | "info" } | null {
  if (args.failureReason) {
    return {
      text: failureReasonMessage(args.failureReason, args.cash, args.price),
      tone: "error",
    };
  }

  if (args.cash < args.price) {
    return {
      text: failureReasonMessage("insufficient_funds", args.cash, args.price),
      tone: "error",
    };
  }

  if (!args.isOnline) {
    return {
      text: "You’re offline — funds are held now and the purchase settles when you reconnect.",
      tone: "info",
    };
  }

  return null;
}

export function ListingDetailScreen({ listing, isLoading }: ListingDetailScreenProps) {
  const styles = useStyles();
  const router = useRouter();
  const cash = useCash();
  const isOnline = useIsOnline();
  const purchaseListing = useGameStore((store) => store.purchaseListing);
  const [failureReason, setFailureReason] = useState<PurchaseFailure | null>(null);

  const pokemon = listing ? pokemonFromListing(listing) : null;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.body}>Loading…</Text>
      </View>
    );
  }

  if (!pokemon || !listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Listing unavailable</Text>
        <Text style={styles.body}>This market lot entry isn’t for sale anymore.</Text>
      </View>
    );
  }

  const statusMessage = purchaseStatusMessage({
    isOnline,
    cash,
    price: listing.markPrice,
    failureReason,
  });
  const canBuy = cash >= listing.markPrice && failureReason !== "already_purchased";

  return (
    <PokemonDetailScreen
      pokemon={pokemon}
      actions={
        <BuyAction
          price={listing.markPrice}
          disabled={!canBuy}
          statusMessage={statusMessage?.text}
          statusTone={statusMessage?.tone}
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
  );
}

const useStyles = makeStyles((colors) => ({
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 8,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
}));
