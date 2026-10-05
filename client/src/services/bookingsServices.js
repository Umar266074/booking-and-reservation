import apiClient from "./apiClient";

export const getBookingAPI = async () => {
  const response = await apiClient.get("/bookings");
  return response.data;
};

export const getBookingByIdAPI = async (id) => {
  const response = await apiClient.get(`/bookings/${id}`);
  return response.data;
};

export const addBookingAPI = async (bookingsData) => {
  const response = await apiClient.post("/bookings", bookingsData);
  return response.data;
};

export const editBookingAPI = async (id, editBookingsData) => {
  const response = await apiClient.put(`/bookings/${id}`, editBookingsData);
  return response.data;
};

export const deleteBookingByIdAPI = async (id) => {
  const response = await apiClient.delete(`/bookings/${id}`);
  return response.data;
};