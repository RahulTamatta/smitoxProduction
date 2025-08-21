// Normalize product shape for UI components
export const normalizeProductForCard = (p = {}) => {
  const multipleimages = Array.isArray(p.multipleimages) ? p.multipleimages : [];
  const photos = p.photos || (multipleimages[0] ?? "");
  return { ...p, multipleimages, photos };
};
