import axiosInstance from './axios';

export const usersAPI = {
  getProfile: () => axiosInstance.get('/users/profile'),
  updateProfile: (data) => axiosInstance.put('/users/profile', data),
  uploadProfileImage: (formData) =>
    axiosInstance.post('/users/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAddresses: () => axiosInstance.get('/users/addresses'),
  addAddress: (data) => axiosInstance.post('/users/addresses', data),
  updateAddress: (id, data) => axiosInstance.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => axiosInstance.delete(`/users/addresses/${id}`),
};