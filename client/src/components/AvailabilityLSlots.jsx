import Button from "./Button";
import { normalizeDate, normalizeTime, todayStr, DAYS } from "../utils/dateTime";

export default function AvailabilitySlots({ slots, canBook, canManage, onBook, onDelete }) {
  const today = todayStr();

  const dated = slots
    .filter((slot) => slot.specific_date)
    .map((slot) => ({ ...slot, date: normalizeDate(slot.specific_date) }))
    .filter((slot) => slot.date >= today)
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));

  const weekly = slots.filter((slot) => !slot.specific_date);

  if (dated.length === 0 && weekly.length === 0) {
    return <p>There is no Availability of resource at this time.</p>;
  }

  return (
    <div className="slot-list">
      {dated.map((slot) => (
        <div className="slot-row" key={slot.id}>
          <span>
            <strong>{slot.date}</strong> · {normalizeTime(slot.start_time)} – {normalizeTime(slot.end_time)}
          </span>
          <span className="slot-actions">
            {canBook && <Button onClick={() => onBook(slot)}>Book</Button>}
            {canManage && <Button variant="danger" onClick={() => onDelete(slot.id)}>Delete</Button>}
          </span>
        </div>
      ))}

      {weekly.length > 0 && (
        <>
          <p className="meta">Weekly slots (For Bookings Availabilities specific date is required):</p>
          {weekly.map((slot) => (
            <div className="slot-row" key={slot.id}>
              <span>
                {DAYS[slot.day_of_week] ?? "Day"} · {normalizeTime(slot.start_time)} – {normalizeTime(slot.end_time)}
              </span>
              {canManage && <Button variant="danger" onClick={() => onDelete(slot.id)}>Delete</Button>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
