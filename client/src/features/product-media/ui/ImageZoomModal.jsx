import React from "react";
import OptimizedImage from "../../../components/UI/OptimizedImage";

export default function ImageZoomModal({ src, thumbs = [], open, onClose, selected = 0, onSelect }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "grid", gridTemplateRows: "auto 1fr auto" }}>
      <button onClick={onClose} style={{ color: "#fff", padding: 8, justifySelf: "end" }}>Close</button>
      <div style={{ display: "grid", placeItems: "center" }}>
        <OptimizedImage src={src} alt="zoom" style={{ maxHeight: "80vh", width: "auto" }} />
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: 8 }}>
        {thumbs.map((t, i) => (
          <button key={i} onClick={() => onSelect?.(i)} style={{ border: selected === i ? "2px solid #ffa41c" : "1px solid #ddd" }}>
            <OptimizedImage src={t} alt={`thumb-${i}`} style={{ width: 64, height: 64, objectFit: "cover" }} />
          </button>
        ))}
      </div>
    </div>
  );
}
