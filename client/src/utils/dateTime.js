const pad = (n) => String(n).padStart(2, "0");

export const normalizeDate = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d)) return String(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const normalizeTime = (value) => (value ? String(value).slice(0, 5) : "");

export const toMinutes = (time) => {
  const [h, m] = normalizeTime(time).split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (total) => `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;

export const todayStr = () => normalizeDate(new Date());

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
