import React from "react";
import OptimizedImage from "../../../components/UI/OptimizedImage";

export default function ImageGallery({ main, images = [], onZoom, selectedIndex = 0, onSelect }) {
  return (
    <div>
      <div style={{ position: "relative", marginBottom: 10 }} onClick={onZoom}>
        <OptimizedImage src={main} alt="product" style={{ width: "100%", height: "auto" }} />
      </div>
      {images.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {images.map((img, i) => (
            <button key={i} onClick={() => onSelect?.(i)} style={{ border: selectedIndex === i ? "2px solid #ffa41c" : "1px solid #ddd" }}>
              <OptimizedImage src={img} alt={`thumb-${i}`} style={{ width: 64, height: 64, objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
