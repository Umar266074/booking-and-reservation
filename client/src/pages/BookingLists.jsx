import useBookings from "../hooks/useBookings";
import useResources from "../hooks/useResources";
import useAuth from "../hooks/useAuth";
import Button from "../components/Button";
import { normalizeDate, normalizeTime } from "../utils/dateTime";

const badgeClass = { confirmed: "badge-on", cancelled: "badge-off", pending: "badge-neutral" };

export default function BookingLists() {
  const { items: bookings, loading, error, cancel } = useBookings();
  const { items: resources } = useResources();
  const { isCustomer } = useAuth();

  const nameOf = (id) => resources.find((r) => r.id === id)?.name ?? `Resource #${id}`;

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this Booking?")) return;
    try {
      await cancel(id);
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>{isCustomer ? "My  Bookings" : "Bookings"}</h2>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="field-error">{error}</p>}
      {!loading && bookings.length === 0 && <p>There is no bookings now.</p>}

      <div className="grid">
        {bookings.map((b) => (
          <div className="card" key={b.id}>
            <div className="card-head">
              <h3>{nameOf(b.resource_id)}</h3>
              <span className={`badge ${badgeClass[b.status] ?? "badge-neutral"}`}>{b.status}</span>
            </div>
            <p>{normalizeDate(b.specific_date)} · {normalizeTime(b.start_time)} – {normalizeTime(b.end_time)}</p>
            {!isCustomer && <p className="meta">User #{b.user_id}</p>}
            {b.status !== "cancelled" && (
              <div className="card-actions">
                <Button variant="danger" onClick={() => handleCancel(b.id)}>Cancel booking</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
