import catalogJson from "@/data/catalog.json";

import { catalogSchema, type CatalogSpecies } from "@/data/catalog.schema";

export const catalog = catalogSchema.parse(catalogJson);

export function getCatalogSpecies(): CatalogSpecies[] {
  return catalog.species;
}

export function getSpeciesById(id: number): CatalogSpecies | undefined {
  return catalog.species.find((species) => species.id === id);
}

export function getSpeciesBySlug(slug: string): CatalogSpecies | undefined {
  return catalog.species.find((species) => species.slug === slug);
}
