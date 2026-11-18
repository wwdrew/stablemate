import { recordLabel } from "@/lib/a11y";

test("records read as words, with singulars", () => {
  expect(recordLabel(0, 0)).toBe("0 wins, 0 losses");
  expect(recordLabel(1, 1)).toBe("1 win, 1 loss");
  expect(recordLabel(3, 2)).toBe("3 wins, 2 losses");
});
