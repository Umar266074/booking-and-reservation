import { useState } from "react";
import Input from "./Input";
import Button from "./Button";

export default function ResourceForm({ initial, onSubmit, submitLabel = "Save" }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    capacity: initial?.capacity ?? 1,
    duration_minutes: initial?.duration_minutes ?? 30,
    is_active: initial ? Boolean(initial.is_active) : true,
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({
        ...form,
        capacity: Number(form.capacity),
        duration_minutes: Number(form.duration_minutes),
      });
    } catch (err) {
      setError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
      <Input label="Description" name="description" value={form.description} onChange={handleChange} />
      <Input label="Capacity" name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} />
      <Input label="Duration (minutes)" name="duration_minutes" type="number" min="1" value={form.duration_minutes} onChange={handleChange} />
      <label>
        <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active
      </label>
      {error && <p className="field-error">{String(error)}</p>}
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}