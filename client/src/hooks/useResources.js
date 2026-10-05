import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchResources,
  fetchResourceById,
  addResource,
  editResource,
  deleteResource,
} from "../store/slices/resourceSlice";

export default function useResources({ autoFetch = true } = {}) {
  const dispatch = useDispatch();
  const { items, selected, loading, error } = useSelector(
    (state) => state.resources
  );

  useEffect(() => {
    if (autoFetch) dispatch(fetchResources());
  }, [dispatch, autoFetch]);

  const getOne = useCallback((id) => dispatch(fetchResourceById(id)).unwrap(), [dispatch]);
  const create = useCallback((data) => dispatch(addResource(data)).unwrap(), [dispatch]);
  const update = useCallback((id, data) => dispatch(editResource({ id, data })).unwrap(), [dispatch]);
  const remove = useCallback((id) => dispatch(deleteResource(id)).unwrap(), [dispatch]);

  return { items, selected, loading, error, getOne, create, update, remove };
}