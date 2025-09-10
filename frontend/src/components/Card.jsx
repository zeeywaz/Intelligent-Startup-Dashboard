// components/Card.jsx
import { Link } from "react-router-dom";
import "./Card.css";

export default function Card({ icon: Icon, label, to = "#" }) {
  return (
    <Link to={to} className="ud-card" aria-label={label}>
      <div className="ud-card__icon" aria-hidden>
        <Icon size={40} />
      </div>
      <p className="ud-card__label">{label}</p>
    </Link>
  );
}
