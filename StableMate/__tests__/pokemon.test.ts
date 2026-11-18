import { formatTypes, typesAndRecord } from "@/lib/pokemon";

test("formatTypes capitalises each type and keeps the rest of the text alone", () => {
  expect(formatTypes(["water"])).toBe("Water");
  expect(formatTypes(["fire", "flying"])).toBe("Fire / Flying");
});

test("the types-and-record line has a spoken form", () => {
  expect(typesAndRecord("Water", 1, 0)).toEqual({
    text: "Water · 1W–0L",
    label: "Water, 1 win, 0 losses",
  });
});
