import { formatTypes } from "@/lib/pokemon";

test("formatTypes capitalises each type and keeps the rest of the text alone", () => {
  expect(formatTypes(["water"])).toBe("Water");
  expect(formatTypes(["fire", "flying"])).toBe("Fire / Flying");
});
