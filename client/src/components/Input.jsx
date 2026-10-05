export default function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  ...rest 
}) {
  return (
    <div className="field">
      {label && <label htmlFor={name}>{label}</label>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        {...rest}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}