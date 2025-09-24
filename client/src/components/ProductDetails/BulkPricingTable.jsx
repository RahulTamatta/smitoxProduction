import React from 'react';

const BulkPricingTable = ({
  product,
  unitSet,
  selectedBulk,
  totalPrice,
  isMobile
}) => {
  const headingStyle = {
    fontSize: isMobile ? "16px" : "18px",
    fontWeight: "bold",
    color: "#333",
    marginTop: "20px",
    marginBottom: isMobile ? "10px" : "15px",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
    fontSize: isMobile ? "13px" : "14px",
  };

  const thTdStyle = {
    border: "1px solid #ddd",
    padding: isMobile ? "3px" : "4px",
    textAlign: "left",
    fontSize: isMobile ? "12px" : "14px",
  };

  return (
    <>
      <h3 style={headingStyle}>
        Bulk Pricing
      </h3>
      
      {product.bulkProducts && product.bulkProducts.length > 0 ? (
        <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Min Qty</th>
                <th style={thTdStyle}>Max Qty</th>
                <th style={thTdStyle}>Price/set</th>
                <th style={thTdStyle}>Total Price</th>
                <th style={thTdStyle}>Select</th>
              </tr>
            </thead>
            <tbody>
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
                  <tr
                    key={index}
                    style={{
                      backgroundColor: autoSelectCondition
                        ? "#e6f7ff"
                        : "transparent",
                    }}
                  >
                    <td style={thTdStyle}>{minQty}</td>
                    <td style={thTdStyle}>{maxQty}</td>
                    <td style={thTdStyle}>
                      ₹{parseFloat(bulk.selling_price_set).toFixed(2)}
                    </td>
                    <td style={thTdStyle}>
                      {autoSelectCondition
                        ? `₹${totalPrice.toFixed(2)}`
                        : "-"}
                    </td>
                    <td style={{...thTdStyle, textAlign: "center"}}>
                      <input
                        type="checkbox"
                        checked={autoSelectCondition}
                        readOnly
                        disabled
                        style={{
                          width: isMobile ? "16px" : "20px",
                          height: isMobile ? "16px" : "20px",
                          backgroundColor: autoSelectCondition
                            ? "#000000"
                            : "#333333",
                          border: "2px solid #000000",
                          cursor: "not-allowed",
                          accentColor: "#ffffff",
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ fontSize: isMobile ? "14px" : "16px" }}>
          No bulk pricing available for this product.
        </p>
      )}
    </>
  );
};

export default BulkPricingTable;
