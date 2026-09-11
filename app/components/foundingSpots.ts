/**
 * Publish the running founding spot count only once it is genuinely scarce.
 * Above this, "92 left" reads as "eight people have paid", which is anti
 * social proof, not urgency. The price promise (locked for life, rises when
 * the cap fills) still renders whenever the cap is open; only the tally is
 * held back. Mirrors FOUNDING_COUNT_VISIBLE_AT in the app's
 * src/config/pricingConfig.ts — change both together.
 */
export const FOUNDING_COUNT_VISIBLE_AT = 25;

/** True when the spot count should appear alongside the founding price. */
export const showFoundingSpotCount = (spotsLeft: number): boolean =>
  Number.isFinite(spotsLeft) && spotsLeft > 0 && spotsLeft <= FOUNDING_COUNT_VISIBLE_AT;
