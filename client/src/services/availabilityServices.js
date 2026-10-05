import api from './apiClient';

export const getAvailabilityAPI = async (params)=>{
    const response = await apiClient.get('/availability', {params});
    return response.data;
};

export const getAvailabilityByIdAPI = async (id)=>{
    const response = await apiClient.get(`/availability/${id}`);
    return response.data;
};

export const addAvailabilityAPI = async (availabilityData)=>{
    const response = await apiClient.post('/availability', availabilityData);
    return response.data;
};

export const editAvailabilityAPI = async (id, editAvailabilityData)=>{
    const response = await apiClient.put(`/availability/${id}`, editAvailabilityData);
    return response.data;
};

export const deleteAvailabilityByIdAPI = async (id)=>{
    const response = await apiClient.delete(`/availability/${id}`);
    return response.data;
};