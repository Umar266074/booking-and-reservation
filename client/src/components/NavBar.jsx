import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function NavBar() {
  const { isLoggedIn, isAdmin, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">Booking System</Link>

      <div className="nav-links">
        {isLoggedIn ? (
          <>
            <Link to="/resources">Resources</Link>
            <Link to="/bookings">Bookings</Link>
            <Link to="/availability">Availability</Link>
            {isAdmin && <Link to="/admin/users">Users</Link>}
            <span className="role-tag">{role}</span>
            <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}