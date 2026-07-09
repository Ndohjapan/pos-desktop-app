/**
 * Round a monetary amount to 2 decimal places (kobo) to stop floating-point
 * drift accumulating through sums and multiplications (e.g. 0.1 + 0.2). Apply
 * to every computed money value before it is stored or displayed.
 *
 * Note: this eliminates the *practical* rounding drift without a schema change.
 * The deeper fix — storing money as integer minor units — is a separate,
 * data-migrating change best done against the live database with a test cycle.
 */
export function round2(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

export function sumMoney(values: number[]): number {
  return round2(values.reduce((total, value) => total + value, 0))
}
