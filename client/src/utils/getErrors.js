export default function getError(err) {
  const data = err.response?.data;
  if (data?.errors) {
    return data.errors.map((e) => e.errors || e.message).join(", ");
  }
  return data?.message || err.message;
}