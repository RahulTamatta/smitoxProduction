import productModel from "../models/productModel.js";

/**
 * Calculate bulk price for a product based on quantity
 * @param {Object} product - Product object with bulkProducts array
 * @param {Number} quantity - Quantity to calculate price for
 * @returns {Number} - Calculated price per unit
 */
export const calculateBulkPrice = (product, quantity) => {
  const unitSet = product.unitSet || 1;
  
  if (!product.bulkProducts || product.bulkProducts.length === 0) {
    return parseFloat(product.perPiecePrice || product.price || 0);
  }

  // Sort bulk products by minimum quantity (descending)
  const sortedBulkProducts = [...product.bulkProducts]
    .filter(bp => bp && bp.minimum)
    .sort((a, b) => b.minimum - a.minimum);

  // Check highest tier first
  if (sortedBulkProducts.length > 0 && quantity >= (sortedBulkProducts[0].minimum * unitSet)) {
    return parseFloat(sortedBulkProducts[0].selling_price_set);
  }

  // Find applicable tier
  const applicableBulk = sortedBulkProducts.find(
    (bp) => quantity >= (bp.minimum * unitSet) && 
            (!bp.maximum || quantity <= (bp.maximum * unitSet))
  );

  if (applicableBulk) {
    return parseFloat(applicableBulk.selling_price_set);
  }

  // Fallback to regular price
  return parseFloat(product.perPiecePrice || product.price || 0);
};

/**
 * Enrich order products with snapshot data
 * @param {Array} products - Array of product items from cart
 * @param {Boolean} skipEnrichment - If true, returns products as-is (for Flutter compatibility)
 * @returns {Promise<Array>} - Array of enriched product items with snapshot data
 */
export const enrichOrderProducts = async (products, skipEnrichment = false) => {
  // If skipEnrichment is true, return products as-is (Flutter app compatibility)
  if (skipEnrichment) {
    return products.map(item => ({
      product: item.product,
      quantity: item.quantity || 0,
      price: item.price || 0,
      // Optional snapshot fields will use schema defaults if not provided
      ...(item.unitPrice && { unitPrice: item.unitPrice }),
      ...(item.netAmount && { netAmount: item.netAmount }),
      ...(item.taxAmount && { taxAmount: item.taxAmount }),
      ...(item.totalAmount && { totalAmount: item.totalAmount }),
      ...(item.gst !== undefined && { gst: item.gst }),
      ...(item.productName && { productName: item.productName }),
      ...(item.productImage && { productImage: item.productImage }),
      ...(item.unitSet && { unitSet: item.unitSet })
    }));
  }

  const enrichedProducts = await Promise.all(
    products.map(async (item) => {
      try {
        // Fetch full product details
        const product = await productModel.findById(item.product);
        
        if (!product) {
          console.error(`Product not found: ${item.product}`);
          // Return basic item if product not found
          return {
            product: item.product,
            quantity: item.quantity || 0,
            price: item.price || 0,
            unitPrice: item.price || 0,
            netAmount: (item.price || 0) * (item.quantity || 0),
            taxAmount: 0,
            totalAmount: (item.price || 0) * (item.quantity || 0),
            gst: 0,
            productName: "Unknown Product",
            productImage: "",
            unitSet: 1
          };
        }

        const quantity = item.quantity || 0;
        
        // Calculate unit price (use provided price or calculate bulk price)
        let unitPrice = parseFloat(item.price) || 0;
        if (unitPrice === 0) {
          unitPrice = calculateBulkPrice(product, quantity);
        }

        // Get GST percentage
        const gst = parseFloat(product.gst) || 0;

        // Calculate amounts
        const netAmount = parseFloat((unitPrice * quantity).toFixed(2));
        const taxAmount = parseFloat(((netAmount * gst) / 100).toFixed(2));
        const totalAmount = parseFloat((netAmount + taxAmount).toFixed(2));

        // Return enriched product with snapshot data
        return {
          product: item.product,
          quantity: quantity,
          price: unitPrice, // Keep for backward compatibility
          // Snapshot data
          unitPrice: unitPrice,
          netAmount: netAmount,
          taxAmount: taxAmount,
          totalAmount: totalAmount,
          gst: gst,
          productName: product.name || "",
          productImage: product.photos || "",
          unitSet: product.unitSet || 1
        };
      } catch (error) {
        console.error(`Error enriching product ${item.product}:`, error);
        // Return basic item on error
        return {
          product: item.product,
          quantity: item.quantity || 0,
          price: item.price || 0,
          unitPrice: item.price || 0,
          netAmount: (item.price || 0) * (item.quantity || 0),
          taxAmount: 0,
          totalAmount: (item.price || 0) * (item.quantity || 0),
          gst: 0,
          productName: "Unknown Product",
          productImage: "",
          unitSet: 1
        };
      }
    })
  );

  return enrichedProducts;
};
