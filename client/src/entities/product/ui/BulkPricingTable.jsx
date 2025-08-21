import React from "react";

export default function BulkPricingTable({ bulkProducts = [], unitSet = 1, selectedBulk, total }) {
  if (!Array.isArray(bulkProducts) || bulkProducts.length === 0) return null;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left" }}>Min</th>
          <th style={{ textAlign: "left" }}>Max</th>
          <th style={{ textAlign: "left" }}>Price</th>
        </tr>
      </thead>
      <tbody>
        {bulkProducts.map((b, idx) => (
          <tr key={idx} style={{ background: selectedBulk === b ? "#fff7e6" : "transparent" }}>
            <td>{b.minimum * unitSet}</td>
            <td>{b.maximum ? b.maximum * unitSet : "∞"}</td>
            <td>₹{b.selling_price_set}</td>
          </tr>
        ))}
        {typeof total === "number" && (
          <tr>
            <td colSpan={3} style={{ fontWeight: 600 }}>Total: ₹{total.toFixed(2)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
