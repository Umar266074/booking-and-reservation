import { Link } from "react-router-dom";
import Button from "./Button";

export default function ResourceCard({ resource, canManage = false, onDelete }) {
  const { id, name, description, capacity, duration_minutes, is_active } = resource;

  return (
    <div className="card">
      <div className="card-head">
        <h3>{name}</h3>
        <span className={`badge ${is_active ? "badge-on" : "badge-off"}`}>
          {is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <p>{description}</p>
      <p className="meta">
        Capacity: {capacity} · Duration: {duration_minutes} min
      </p>

      <div className="card-actions">
        <Link to={`/resources/${id}`}>View &amp; Book</Link>
        {canManage && (
          <Button variant="danger" onClick={() => onDelete(id)}>
            Deactivate
          </Button>
        )}
      </div>
    </div>
  );
}