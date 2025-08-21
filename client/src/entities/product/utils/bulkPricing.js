export const getApplicableBulkProduct = (product, quantity, unitSet = 1) => {
  const list = (product?.bulkProducts ?? [])
    .filter((b) => b?.minimum)
    .sort((a, b) => b.minimum - a.minimum);

  const top = list[0];
  if (top && quantity >= top.minimum * unitSet) return top;

  return (
    list.find(
      (b) => quantity >= b.minimum * unitSet && (!b.maximum || quantity <= b.maximum * unitSet)
    ) || null
  );
};

export const calcTotalPrice = (bulk, quantity, product) => {
  const base = bulk ? parseFloat(bulk.selling_price_set) : parseFloat(product?.perPiecePrice ?? 0);
  return +(quantity * base).toFixed(2);
};
