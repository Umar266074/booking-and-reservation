import { useSelector, useDispatch } from "react-redux";
import { logout as logoutAction } from "../store/slices/authSlice";

export default function useAuth() {
  const dispatch = useDispatch();
  const { token, role } = useSelector((state) => state.auth);

  const logout = () => dispatch(logoutAction());

  return {
    token,
    role,
    isLoggedIn: !!token,
    isAdmin: role === "admin",
    isProvider: role === "provider",
    isCustomer: role === "customer",
    canManageResources: role === "admin" || role === "provider",
    logout,
  };
}