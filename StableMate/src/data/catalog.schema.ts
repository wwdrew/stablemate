import { z } from "zod";

export const catalogSpeciesSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  name: z.string().min(1),
  types: z.array(z.string().min(1)).min(1),
  stats: z.object({
    hp: z.number().int().nonnegative(),
    attack: z.number().int().nonnegative(),
    defense: z.number().int().nonnegative(),
    specialAttack: z.number().int().nonnegative(),
    specialDefense: z.number().int().nonnegative(),
    speed: z.number().int().nonnegative(),
    total: z.number().int().positive(),
  }),
  sprites: z.object({
    default: z.string().url().nullable(),
    artwork: z.string().url().nullable(),
  }),
  listPrice: z.number().int().positive(),
});

export const catalogSchema = z.object({
  version: z.literal(1),
  source: z.string(),
  generatedAt: z.string(),
  count: z.number().int().positive(),
  species: z.array(catalogSpeciesSchema).length(30),
});

export type CatalogSpecies = z.infer<typeof catalogSpeciesSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
