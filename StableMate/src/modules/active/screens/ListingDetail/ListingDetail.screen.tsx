import { useRouter } from "expo-router";
import { useState } from "react";

import type { MarketListing } from "@/api/marketLot";
import { EmptyState } from "@/components/EmptyState";
import { useAnnouncement } from "@/lib/a11y";
import { formatMoney } from "@/lib/money";
import { BuyAction } from "@/modules/active/screens/PokemonDetail/BuyAction";
import { PokemonDetailScreen } from "@/modules/active/screens/PokemonDetail/PokemonDetail.screen";
import { pokemonFromListing } from "@/modules/active/screens/PokemonDetail/pokemonInstance";
import { type PurchaseResult, useCash, useGameStore } from "@/store/game";
import { useIsOnline } from "@/store/settings";

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
  const router = useRouter();
  const cash = useCash();
  const isOnline = useIsOnline();
  const purchaseListing = useGameStore((store) => store.purchaseListing);
  const [failureReason, setFailureReason] = useState<PurchaseFailure | null>(null);

  const pokemon = listing ? pokemonFromListing(listing) : null;
  // A refused purchase leaves focus on the button, so say why.
  useAnnouncement(
    failureReason && listing
      ? failureReasonMessage(failureReason, cash, listing.markPrice)
      : null,
  );

  if (isLoading) {
    return <EmptyState fill body="Loading…" />;
  }

  if (!pokemon || !listing) {
    return (
      <EmptyState
        fill
        title="Listing unavailable"
        body="This market lot entry isn’t for sale anymore."
      />
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

