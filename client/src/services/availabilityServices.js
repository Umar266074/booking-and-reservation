import api from "./apiClient";

// params = { resource_id: 5 } -> GET /availability?resource_id=5
export const getAvailabilityAPI = async (params) => {
  const response = await api.get("/availability", { params });
  return response.data;
};

export const getAvailabilityByIdAPI = async (id) => {
  const response = await api.get(`/availability/${id}`);
  return response.data;
};

export const addAvailabilityAPI = async (availabilityData) => {
  const response = await api.post("/availability", availabilityData);
  return response.data;
};

export const editAvailabilityAPI = async (id, editAvailabilityData) => {
  const response = await api.put(`/availability/${id}`, editAvailabilityData);
  return response.data;
};

export const deleteAvailabilityByIdAPI = async (id) => {
  const response = await api.delete(`/availability/${id}`);
  return response.data;
};
