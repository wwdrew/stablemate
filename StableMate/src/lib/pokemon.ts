import { recordLabel } from "@/lib/a11y";

/**
 * `["fire", "flying"]` → `"Fire / Flying"`. Done in JS rather than with
 * `textTransform: "capitalize"`, which on iOS also lowercases the rest of the
 * line (the record would read `1w–0l`).
 */
export function formatTypes(types: readonly string[]): string {
  return types
    .map((type) => type.charAt(0).toUpperCase() + type.slice(1))
    .join(" / ");
}

/**
 * The line under a Pokémon's name: `"Water · 1W–0L"` on screen, and
 * `"Water, 1 win, 0 losses"` for screen readers.
 */
export function typesAndRecord(
  types: string,
  wins: number,
  losses: number,
): { text: string; label: string } {
  return {
    text: `${types} · ${wins}W–${losses}L`,
    label: `${types}, ${recordLabel(wins, losses)}`,
  };
}
