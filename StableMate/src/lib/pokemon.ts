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
