import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useResources from "../hooks/useResources";
import useAvailability from "../hooks/useAvailability";
import useBookings from "../hooks/useBookings";
import useAuth from "../hooks/useAuth";
import ResourceForm from "../components/ResourceForm";
import AvailabilitySlots from "../components/AvailabilityLSlots";
import AvailabilityForm from "../components/AvailabilityForm";
import BookingForm from "../components/BookingForm";
import Button from "../components/Button";

export default function ResourceDetail() {
  const { id } = useParams();
  const { selected, loading, error, getOne, update } = useResources({ autoFetch: false });
  const { items: slots, loading: slotsLoading, create: addSlot, remove: removeSlot } =
    useAvailability({ resourceId: id });
  const { create: createBooking } = useBookings({ autoFetch: false });
  const { canManageResources } = useAuth();

  const [editing, setEditing] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getOne(id).catch(() => {});
  }, [id, getOne]);

  const handleUpdate = async (data) => {
    await update(id, data);
    await getOne(id);
    setEditing(false);
  };

  const handleBook = async (data) => {
    await createBooking(data);
    setBookingSlot(null);
    setSuccess("Booking confirm ho gayi!");
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Cance this Availability?")) return;
    try {
      await removeSlot(slotId);
    } catch (err) {
      alert(err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="field-error">{error}</p>;
  if (!selected) return null;

  const isActive = Boolean(selected.is_active);

  return (
    <div className="page">
      <Link to="/resources">← Back</Link>

      {editing ? (
        <ResourceForm initial={selected} onSubmit={handleUpdate} submitLabel="Update" />
      ) : (
        <div className="card">
          <h2>{selected.name}</h2>
          <p>{selected.description}</p>
          <p className="meta">
            Capacity: {selected.capacity} · Duration: {selected.duration_minutes} min ·{" "}
            {isActive ? "Active" : "Inactive"}
          </p>
          {canManageResources && <Button onClick={() => setEditing(true)}>Edit</Button>}
        </div>
      )}

      <section className="section">
        <h3>Availability</h3>
        {success && (
          <p className="success">{success} <Link to="/bookings">See my bookings</Link></p>
        )}
        {slotsLoading && <p>Loading...</p>}

        <AvailabilitySlots
          slots={slots}
          canBook={isActive && !canManageResources}
          canManage={canManageResources}
          onBook={(slot) => { setSuccess(""); setBookingSlot(slot); }}
          onDelete={handleDeleteSlot}
        />

        {!isActive && !canManageResources && <p className="meta">This Resource is in-active, booking is closed.</p>}

        {bookingSlot && (
          <BookingForm
            resource={selected}
            slot={bookingSlot}
            onSubmit={handleBook}
            onCancel={() => setBookingSlot(null)}
          />
        )}

        {canManageResources && <AvailabilityForm resourceId={id} onSubmit={addSlot} />}
      </section>
    </div>
  );
}
