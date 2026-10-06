import { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import { todayStr } from "../utils/dateTime";

export default function AvailabilityForm({ resourceId, onSubmit }) {
  const [form, setForm] = useState({ specific_date: "", start_time: "09:00", end_time: "17:00" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.end_time <= form.start_time) return setError("End time start time ke baad hona chahiye");
    setSaving(true);
    try {
      await onSubmit({ resource_id: Number(resourceId), ...form });
      setForm({ ...form, specific_date: "" });
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3>ADD Availability</h3>
      <Input label="Date" name="specific_date" type="date" min={todayStr()}
             value={form.specific_date} onChange={handleChange} required />
      <Input label="Start time" name="start_time" type="time" value={form.start_time} onChange={handleChange} required />
      <Input label="End time" name="end_time" type="time" value={form.end_time} onChange={handleChange} required />
      {error && <p className="field-error">{error}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add availability"}</Button>
    </form>
  );
}
