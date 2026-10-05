import apiClient from './apiClient';

export const getResourcesAPI = async ()=>{
    const response = await apiClient.get('/resources');
    return response.data;
};

export const getResourcesByIdAPI = async (id)=>{
    const response = await apiClient.get(`/resources/${id}`);
    return response.data;
};

export const addResourcesAPI = async (resourceData)=>{
    const response = await apiClient.post('/resources', resourceData);
    return response.data;
};

export const editResourcesAPI = async (id, editresourceData)=>{
    const response = await apiClient.put(`/resources/${id}`, editresourceData);
    return response.data;
};

export const deleteResourcesByIdAPI = async (id)=>{
    const response = await apiClient.delete(`/resources/${id}`);
    return response.data;
};