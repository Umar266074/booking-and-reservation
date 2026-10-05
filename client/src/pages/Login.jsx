import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginService } from "../services/authServices";
import { setCredentials } from "../store/slices/authSlice";
import getError from "../utils/getErrors";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginService({ email, password });
      dispatch(setCredentials({ token: data.token, role: data.user.role }));
      navigate("/resources");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <Input label="Email" name="email" type="email" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" name="password" type="password" value={password}
               onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="field-error">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
      <p>Account nahi hai? <Link to="/signup">Sign Up</Link></p>
    </div>
  );
}