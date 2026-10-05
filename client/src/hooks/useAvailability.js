import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAvailability,
  fetchAvailabilityById,
  addAvailability,
  editAvailability,
  deleteAvailability,
} from "../store/slices/availabilitySlice";

export default function useAvailability({ autoFetch = true, resourceId } = {}) {
  const dispatch = useDispatch();
  const { items, selected, loading, error } = useSelector(
    (state) => state.availability
  );

  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchAvailability(resourceId ? { resource_id: resourceId } : undefined));
    }
  }, [dispatch, autoFetch, resourceId]);

  const getOne = useCallback((id) => dispatch(fetchAvailabilityById(id)).unwrap(), [dispatch]);
  const create = useCallback((data) => dispatch(addAvailability(data)).unwrap(), [dispatch]);
  const update = useCallback((id, data) => dispatch(editAvailability({ id, data })).unwrap(), [dispatch]);
  const remove = useCallback((id) => dispatch(deleteAvailability(id)).unwrap(), [dispatch]);

  return { items, selected, loading, error, getOne, create, update, remove };
}