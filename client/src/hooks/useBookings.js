import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchBookings,
  fetchBookingById,
  addBooking,
  editBookings,
  deleteBookings,
} from "../store/slices/bookingSlice";

export default function useBookings({ autoFetch = true } = {}) {
  const dispatch = useDispatch();
  const { items, selected, loading, error } = useSelector(
    (state) => state.bookings
  );

  useEffect(() => {
    if (autoFetch) dispatch(fetchBookings());
  }, [dispatch, autoFetch]);

  const getOne = useCallback((id) => dispatch(fetchBookingById(id)).unwrap(), [dispatch]);
  const create = useCallback((data) => dispatch(addBooking(data)).unwrap(), [dispatch]);
  const update = useCallback((id, data) => dispatch(editBookings({ id, data })).unwrap(), [dispatch]);
  const cancel = useCallback((id) => dispatch(deleteBookings(id)).unwrap(), [dispatch]);

  return { items, selected, loading, error, getOne, create, update, cancel };
}