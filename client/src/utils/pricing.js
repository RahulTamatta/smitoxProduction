// Centralized pricing utilities for bulk and per-unit pricing
// All quantities are in UNITS. Bulk tiers define minimum/maximum in SETS and are converted via unitSet.

/**
 * Selects the applicable bulk tier for a given product and quantity (in units).
 * - Sorts tiers ascending by minimum sets
 * - Matches when quantity >= minimum*unitSet and (<= maximum*unitSet if maximum exists)
 * @param {Object} product
 * @param {number} quantity Units
 * @returns {Object|null} bulk tier
 */
export function getApplicableBulkProduct(product, quantity) {
  if (!product || !Array.isArray(product.bulkProducts) || product.bulkProducts.length === 0) return null;
  const unitSet = Number(product.unitSet) || 1;
  const qty = Number(quantity) || 0;

  // Sort descending by minimum to select the most-specific applicable tier
  const sorted = [...product.bulkProducts]
    .filter((b) => b && (b.minimum !== undefined && b.minimum !== null))
    .sort((a, b) => Number(b.minimum) - Number(a.minimum));

  for (const bulk of sorted) {
    const minUnits = Number(bulk.minimum) * unitSet;
    const maxUnits = bulk.maximum ? Number(bulk.maximum) * unitSet : Infinity;
    if (qty >= minUnits && qty <= maxUnits) return bulk;
  }
  return null;
}

/**
 * Returns price per UNIT for a product and quantity using bulk when applicable, otherwise regular price.
 * @param {Object} product
 * @param {number} quantity Units
 * @returns {number} price per unit
 */
export function getPricePerUnit(product, quantity) {
  if (!product || !Number.isFinite(quantity) || quantity <= 0) return 0;
  const unitSet = Number(product.unitSet) || 1;
  const bulk = getApplicableBulkProduct(product, quantity);
  if (bulk && bulk.selling_price_set != null) {
    // selling_price_set is price PER SET — convert to per unit
    const setPrice = parseFloat(bulk.selling_price_set) || 0;
    return setPrice / unitSet;
  }
  // perPiecePrice is already per-unit price, no division needed
  const perPiecePrice = parseFloat(product.perPiecePrice ?? product.price ?? 0) || 0;
  return perPiecePrice;
}

/**
 * Calculates detailed pricing for a product and quantity in units.
 * @param {Object} product
 * @param {number} quantity Units
 * @returns {{unitPrice:number,totalPrice:number,bulkApplied:Object|null,priceType:'bulk_unit'|'regular_unit'}}
 */
export function calculateProductPrice(product, quantity) {
  const unitPrice = getPricePerUnit(product, quantity);
  const bulkApplied = getApplicableBulkProduct(product, quantity);
  return {
    unitPrice,
    totalPrice: unitPrice * (Number(quantity) || 0),
    bulkApplied,
    priceType: bulkApplied ? 'bulk_unit' : 'regular_unit',
  };
}
