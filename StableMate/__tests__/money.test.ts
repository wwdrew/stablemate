import { formatMoney, formatSignedMoney } from "@/lib/money";

test("formatMoney groups thousands and keeps whole dollars", () => {
  expect(formatMoney(0)).toBe("$0");
  expect(formatMoney(407)).toBe("$407");
  expect(formatMoney(1234)).toBe("$1,234");
  expect(formatMoney(1234567)).toBe("$1,234,567");
  expect(formatMoney(-50)).toBe("-$50");
});

test("formatSignedMoney marks credits and debits", () => {
  expect(formatSignedMoney(1234)).toBe("+$1,234");
  expect(formatSignedMoney(-1234)).toBe("-$1,234");
  expect(formatSignedMoney(0)).toBe("$0");
});
