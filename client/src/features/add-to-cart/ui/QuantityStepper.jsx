import React from "react";

export default function QuantityStepper({ value, unit = 1, onInc, onDec, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={onDec} disabled={disabled} aria-label="decrement">-</button>
      <input type="number" value={value} readOnly style={{ width: 60, textAlign: "center" }} />
      <button onClick={onInc} disabled={disabled} aria-label="increment">+</button>
      {unit > 1 && <span style={{ marginLeft: 8 }}>/ {unit}</span>}
    </div>
  );
}
