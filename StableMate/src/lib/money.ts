// Amounts are whole dollars, so no fraction digits.
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** `1234` → `$1,234`, `-50` → `-$50`. */
export function formatMoney(amount: number): string {
  return currency.format(amount);
}

/** Like `formatMoney`, but marks credits with `+`: `+$1,234`, `-$50`, `$0`. */
export function formatSignedMoney(amount: number): string {
  if (amount > 0) {
    return `+${formatMoney(amount)}`;
  }
  return formatMoney(amount);
}
