import React from "react";

export default function YouTubeModal({ url, open, onClose }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "grid", placeItems: "center" }}>
      <div style={{ width: "90%", maxWidth: 800, background: "#000" }}>
        <button onClick={onClose} style={{ color: "#fff", padding: 8 }}>Close</button>
        <div style={{ position: "relative", paddingTop: "56.25%" }}>
          <iframe src={url} title="YouTube" frameBorder="0" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        </div>
      </div>
    </div>
  );
}
