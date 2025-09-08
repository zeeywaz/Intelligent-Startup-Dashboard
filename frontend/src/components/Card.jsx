import React from "react";
import "./Card.css"; // reuse the same CSS

export default function Card({ icon: Icon, label }) {
  return (
    <div className="card">
      <Icon size={48} />
      <p>{label}</p>
    </div>
  );
}
