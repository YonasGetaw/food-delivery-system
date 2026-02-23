import axiosInstance from './axios';

export const ordersAPI = {
  create: (data) => axiosInstance.post('/orders', data),
  getById: (id) => axiosInstance.get(`/orders/${id}`),
  track: (id) => axiosInstance.get(`/orders/${id}/track`),
  cancel: (id, reason) => axiosInstance.post(`/orders/${id}/cancel`, { reason }),
  rate: (id, data) => axiosInstance.post(`/orders/${id}/rate`, data),
  getStudentOrders: (page = 1, limit = 10) => 
    axiosInstance.get(`/student/orders?page=${page}&limit=${limit}`),
};