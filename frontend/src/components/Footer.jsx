import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer" role="contentinfo">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h3>Created By: <span style={{ color: "#8cd8ff" }}>M. A. Khan</span> | 9001015311</h3>
        
        <p style={{ marginTop: 8, opacity: 0.85 }}>© {year} WCRMS KOTA — All Rights Reserved</p>
      </div>
    </footer>
  );
}
