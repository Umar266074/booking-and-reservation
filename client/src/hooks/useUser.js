import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchUsers, updateUserRole } from "../store/slices/userRoleSlice";

export default function useUsers({ autoFetch = true } = {}) {
  const dispatch = useDispatch();
  const { list: users, loading, error } = useSelector((state) => state.userRole);

  useEffect(() => {
    if (autoFetch) dispatch(fetchUsers());
  }, [dispatch, autoFetch]);

  const changeRole = useCallback(
    (userId, role) => dispatch(updateUserRole({ userId, role })).unwrap(),
    [dispatch]
  );

  return { users, loading, error, changeRole };
}