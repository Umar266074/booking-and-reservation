import apiClient from './apiClient';

export const getAllUsersService = async () => {
  const response = await apiClient.get('/updateRole');
  return response.data;
};

export const getAllUsersByIdService = async (id) => {
  const response = await apiClient.get(`/updateRole/${id}`);
  return response.data;
};


export const updateUserRoleService = async (userId, role) => {
  const response = await apiClient.patch(`/updateRole/${userId}`, { role });
  return response.data;
};