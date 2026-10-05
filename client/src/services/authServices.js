import apiClient from './apiClient';

export const registerService = async (userData)=>{
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
};

export const loginService = async ( credentials)=>{
    const response = await apiClient.post(`/auth/login`, credentials);
    return response.data;
};
