import axiosInstance from './axios';

export const authAPI = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data),
  refreshToken: (data) => axiosInstance.post('/auth/refresh', data),
  getMe: () => axiosInstance.get('/auth/me'),
  changePassword: (data) => axiosInstance.post('/auth/change-password', data),
  logout: () => axiosInstance.post('/auth/logout'),
};