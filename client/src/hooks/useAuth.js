import { useSelector, useDispatch } from "react-redux";
import { logout as logoutAction } from "../store/slices/authSlice";

export default function useAuth() {
  const dispatch = useDispatch();
  const { token, role, userId } = useSelector((state) => state.auth);

  const logout = () => dispatch(logoutAction());

  const isAdmin = role === "admin";
  const isProvider = role === "provider";

 
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
    canManageResources: isAdmin || isProvider,   
    canEditResource,                             
    logout,
  };
}
