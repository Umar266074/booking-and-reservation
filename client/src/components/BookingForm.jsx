import { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import { normalizeDate, normalizeTime, toMinutes, fromMinutes } from "../utils/dateTime";

export default function BookingForm({ resource, slot, onSubmit, onCancel }) {
  const date = normalizeDate(slot.specific_date);
  const slotStart = normalizeTime(slot.start_time);
  const slotEnd = normalizeTime(slot.end_time);

  const defaultEnd = (start) =>
    fromMinutes(Math.min(toMinutes(start) + Number(resource.duration_minutes || 30), toMinutes(slotEnd)));

  const [start, setStart] = useState(slotStart);
  const [end, setEnd] = useState(defaultEnd(slotStart));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleStart = (e) => {
    setStart(e.target.value);
    setEnd(defaultEnd(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (toMinutes(end) <= toMinutes(start)) return setError("End time start time ke baad hona chahiye");
    if (toMinutes(start) < toMinutes(slotStart) || toMinutes(end) > toMinutes(slotEnd)) {
      return setError(`Time ${slotStart} aur ${slotEnd} ke darmiyan hona chahiye`);
    }
    setSaving(true);
    try {
      await onSubmit({
        resource_id: resource.id,
        specific_date: date,
        start_time: start,
        end_time: end,
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3>Book: {date}</h3>
      <p className="meta">Available: {slotStart} – {slotEnd} (slot {resource.duration_minutes} min)</p>
      <Input label="Start time" name="start_time" type="time" value={start}
             onChange={handleStart} min={slotStart} max={slotEnd} required />
      <Input label="End time" name="end_time" type="time" value={end}
             onChange={(e) => setEnd(e.target.value)} min={slotStart} max={slotEnd} required />
      {error && <p className="field-error">{error}</p>}
      <div className="card-actions">
        <Button type="submit" disabled={saving}>{saving ? "Booking..." : "Confirm booking"}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
