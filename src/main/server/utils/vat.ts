/**
 * Optional VAT charged at checkout. Pure (no Node/Electron imports) so the
 * renderer and the local server share one definition of the maths.
 */

// Nigerian VAT rate, in percent.
export const VAT_RATE = 7.5

/**
 * VAT on the net order value: items + service fee − discount (VAT is charged on
 * what the customer actually pays for, so a discount reduces the VAT too).
 * Rounded to kobo.
 */
export function computeVat(netAmount: number, rate: number = VAT_RATE): number {
  const vat = (Math.max(0, netAmount) * rate) / 100
  return Math.round((vat + Number.EPSILON) * 100) / 100
}
