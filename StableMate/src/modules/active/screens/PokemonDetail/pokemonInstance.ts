import type { MarketListing } from "@/api/marketLot";
import { getSpeciesById, getSpeciesBySlug } from "@/data/catalog";
import type { CatalogSpecies } from "@/data/catalog.schema";
import type { OwnedPokemon } from "@/store/game";

export type PokemonInstance = {
  id: string;
  slug: string;
  name: string;
  types: string[];
  sprites: CatalogSpecies["sprites"];
  stats: CatalogSpecies["stats"];
  wins: number;
  losses: number;
  listPrice: number;
  markPrice: number;
};

export function pokemonFromListing(
  listing: MarketListing,
): PokemonInstance | null {
  const species = getSpeciesById(listing.speciesId);
  if (!species) {
    return null;
  }

  return {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    types: listing.types,
    sprites: species.sprites,
    stats: species.stats,
    wins: listing.wins,
    losses: listing.losses,
    listPrice: listing.listPrice,
    markPrice: listing.markPrice,
  };
}

export function pokemonFromOwned(owned: OwnedPokemon): PokemonInstance | null {
  const species = getSpeciesBySlug(owned.speciesId);
  if (!species) {
    return null;
  }

  return {
    id: owned.id,
    slug: species.slug,
    name: species.name,
    types: species.types,
    sprites: species.sprites,
    stats: species.stats,
    wins: owned.wins,
    losses: owned.losses,
    listPrice: species.listPrice,
    markPrice: owned.markPrice,
  };
}
