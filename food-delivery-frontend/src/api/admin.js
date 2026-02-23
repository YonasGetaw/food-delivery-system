import axiosInstance from './axios';

export const adminAPI = {
  getDashboard: (days = 14) => axiosInstance.get(`/admin/dashboard?days=${days}`),
  createVendor: (data) => axiosInstance.post('/admin/vendors', data),
  createRider: (data) => axiosInstance.post('/admin/riders', data),
  getUsers: (page = 1, limit = 10) => axiosInstance.get(`/admin/users?page=${page}&limit=${limit}`),
  getUser: (id) => axiosInstance.get(`/admin/users/${id}`),
  toggleUserStatus: (id) => axiosInstance.post(`/admin/users/${id}/toggle`),
  getVendors: (page = 1, limit = 10) => axiosInstance.get(`/admin/vendors?page=${page}&limit=${limit}`),
  getVendorPerformance: (id) => axiosInstance.get(`/admin/vendors/${id}/performance`),
  getRiders: (page = 1, limit = 10) => axiosInstance.get(`/admin/riders?page=${page}&limit=${limit}`),
  getRiderPerformance: (id) => axiosInstance.get(`/admin/riders/${id}/performance`),
  getOrders: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return axiosInstance.get(`/admin/orders?${params}`);
  },
  getOrder: (id) => axiosInstance.get(`/admin/orders/${id}`),
  assignRider: (orderId, riderId) => 
    axiosInstance.post(`/admin/orders/${orderId}/assign-rider`, { rider_id: riderId }),
  getRevenueReport: (startDate, endDate) => 
    axiosInstance.get(`/admin/reports/revenue?start_date=${startDate}&end_date=${endDate}`),
};