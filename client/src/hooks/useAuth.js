import { useSelector, useDispatch } from "react-redux";
import { logout as logoutAction } from "../store/slices/authSlice";

export default function useAuth() {
  const dispatch = useDispatch();
  const { token, role, userId } = useSelector((state) => state.auth);

  const logout = () => dispatch(logoutAction());

  const isAdmin = role === "admin";
  const isProvider = role === "provider";

  // Backend ka rule: admin sab ka, provider sirf apne resource ka maalik hai.
  const canEditResource = (resource) =>
    isAdmin || (isProvider && resource?.owner_id === userId);

  return {
    token,
    role,
    userId,
    isLoggedIn: !!token,
    isAdmin,
    isProvider,
    isCustomer: role === "customer",
    canManageResources: isAdmin || isProvider,   // "Add Resource" jaise general actions ke liye
    canEditResource,                              // kisi ek resource ko edit/deactivate karne ke liye
    logout,
  };
}
