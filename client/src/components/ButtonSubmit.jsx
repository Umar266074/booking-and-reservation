export default function ButtonSubmit({
  children,
  type = "submit",
  variant = "primary",
  disabled = false,
  onClick,
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}