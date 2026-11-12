/**
 * Fetches a curated Kanto subset from PokéAPI and writes src/data/catalog.json.
 * Run: node scripts/fetch-catalog.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../src/data/catalog.json");

/** 30 curated species — always includes the three starters. */
const SPECIES_IDS = [
  1, 4, 7, // starters
  6, 9, // charizard, blastoise (high-value targets)
  25, 26, // pikachu, raichu
  37, 38, // vulpix, ninetales
  54, 58, 59, // psyduck, growlithe, arcanine
  63, 66, 74, // abra, machop, geodude
  92, 94, // gastly, gengar
  95, 104, 113, // onix, cubone, chansey
  123, 125, 126, 130, 131, // scyther, electabuzz, magmar, gyarados, lapras
  133, 134, 143, 147, 149, // eevee, vaporeon, snorlax, dratini, dragonite
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function titleCase(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function listPriceFromStats(stats) {
  // Cheap enough that early prize money can buy mid-tier; total BST ~180–600.
  return Math.round(40 + stats.total * 1.25);
}

async function fetchPokemon(id) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!response.ok) {
    throw new Error(`PokéAPI ${id} failed: ${response.status}`);
  }
  return response.json();
}

function normalize(detail) {
  const statsRaw = Object.fromEntries(
    detail.stats.map((entry) => [entry.stat.name, entry.base_stat]),
  );

  const stats = {
    hp: statsRaw.hp,
    attack: statsRaw.attack,
    defense: statsRaw.defense,
    specialAttack: statsRaw["special-attack"],
    specialDefense: statsRaw["special-defense"],
    speed: statsRaw.speed,
  };
  stats.total = Object.values(stats).reduce((sum, value) => sum + value, 0);

  return {
    id: detail.id,
    slug: detail.name,
    name: titleCase(detail.name),
    types: detail.types
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => entry.type.name),
    stats,
    sprites: {
      default: detail.sprites.front_default,
      artwork:
        detail.sprites.other?.["official-artwork"]?.front_default ??
        detail.sprites.front_default,
    },
    listPrice: listPriceFromStats(stats),
  };
}

async function main() {
  if (SPECIES_IDS.length !== 30) {
    throw new Error(`Expected 30 ids, got ${SPECIES_IDS.length}`);
  }

  const unique = new Set(SPECIES_IDS);
  if (unique.size !== SPECIES_IDS.length) {
    throw new Error("Duplicate species ids in SPECIES_IDS");
  }

  const species = [];
  for (const id of SPECIES_IDS) {
    process.stdout.write(`Fetching #${id}...\n`);
    const detail = await fetchPokemon(id);
    species.push(normalize(detail));
    await sleep(80);
  }

  species.sort((a, b) => a.id - b.id);

  const catalog = {
    version: 1,
    source: "https://pokeapi.co",
    generatedAt: new Date().toISOString(),
    count: species.length,
    species,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Wrote ${species.length} species → ${OUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
