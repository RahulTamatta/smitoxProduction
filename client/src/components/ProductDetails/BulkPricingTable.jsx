import React from 'react';

const BulkPricingTable = ({
  product,
  unitSet,
  selectedBulk,
  totalPrice,
  isMobile
}) => {


  return (
    <div className="bg-surface-container-low rounded-[16px] md:rounded-[24px] p-4 md:p-6 mb-6 md:mb-8 border border-surface-container-highest overflow-hidden">
      <h3 className="font-label-md text-label-md text-on-surface mb-4 uppercase tracking-wider text-outline">
        Wholesale Pricing Tiers
      </h3>
      
      {product.bulkProducts && product.bulkProducts.length > 0 ? (
        <div className="flex flex-col gap-3">
          {product.bulkProducts.map((bulk, index) => {
            if (!bulk || !bulk.minimum || !bulk.selling_price_set) {
              return null;
            }

            const minQty = bulk.minimum * unitSet;
            const maxQty = bulk.maximum
              ? bulk.maximum * unitSet
              : "No limit";

            const autoSelectCondition =
              selectedBulk && selectedBulk._id === bulk._id;

            return (
              <div
                key={index}
                className={`flex justify-between items-center p-3 rounded-xl ${
                  autoSelectCondition
                    ? 'border-2 border-primary bg-primary-fixed/20 relative'
                    : 'border border-outline-variant bg-surface-container-lowest'
                }`}
              >
                {autoSelectCondition && !isMobile && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                  </div>
                )}
                
                <span className={`font-label-md text-label-md ${autoSelectCondition ? 'text-primary ml-2' : 'text-on-surface-variant font-body-md text-body-md'}`}>
                  {minQty} - {maxQty} Units
                  {autoSelectCondition && (
                    <span className="bg-primary text-on-primary px-2 py-0.5 rounded ml-2 text-[10px]">Selected</span>
                  )}
                </span>
                
                <span className={`font-headline-md text-headline-md ${autoSelectCondition ? 'text-primary' : 'text-on-surface'}`}>
                  ₹{parseFloat(bulk.selling_price_set).toFixed(2)}
                  <span className={`font-body-md text-body-md font-normal ${autoSelectCondition ? 'text-primary' : 'text-on-surface-variant'}`}>
                    /set
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="font-body-md text-body-md text-on-surface-variant">
          No bulk pricing available for this product.
        </p>
      )}
    </div>
  );
};

export default BulkPricingTable;
