import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerService } from "../services/authServices";
import getError from "../utils/getErrors";
import Input from "../components/Input";
import Button from "../components/Button";

export default function SignUp() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerService(form);
      navigate("/login");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
        <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        <Input label="Password (min 8)" name="password" type="password" value={form.password}
               onChange={handleChange} minLength={8} required />
        {error && <p className="field-error">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>
      <p>If you have existing account? <Link to="/login">Login</Link></p>
    </div>
  );
}