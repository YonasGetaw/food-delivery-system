import axiosInstance from './axios';

export const adminAPI = {
  getDashboard: (days = 14) => axiosInstance.get(`/admin/dashboard?days=${days}`),
  uploadImage: (formData) =>
    axiosInstance.post('/admin/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  createVendor: (data) => axiosInstance.post('/admin/vendors', data),
  createRider: (data) => axiosInstance.post('/admin/riders', data),
  getUsers: ({ page = 1, limit = 10, role, is_active } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (role) params.set('role', role);
    if (is_active === true || is_active === false) params.set('is_active', String(is_active));
    if (typeof is_active === 'string' && is_active !== '') params.set('is_active', is_active);
    return axiosInstance.get(`/admin/users?${params.toString()}`);
  },
  getUser: (id) => axiosInstance.get(`/admin/users/${id}`),
  toggleUserStatus: (id) => axiosInstance.post(`/admin/users/${id}/toggle`),
  getVendors: ({ page = 1, limit = 10, is_open } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (is_open === true || is_open === false) params.set('is_open', String(is_open));
    if (typeof is_open === 'string' && is_open !== '') params.set('is_open', is_open);
    return axiosInstance.get(`/admin/vendors?${params.toString()}`);
  },
  getVendorPerformance: (id) => axiosInstance.get(`/admin/vendors/${id}/performance`),
  getRiders: ({ page = 1, limit = 10, available } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (available === true || available === false) params.set('available', String(available));
    if (typeof available === 'string' && available !== '') params.set('available', available);
    return axiosInstance.get(`/admin/riders?${params.toString()}`);
  },
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
  getStatusSummaryReport: (period = 'monthly') =>
    axiosInstance.get(`/admin/reports/status-summary?period=${encodeURIComponent(period)}`),
};