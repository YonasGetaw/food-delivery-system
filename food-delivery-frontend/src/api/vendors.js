import axiosInstance from './axios';

export const vendorsAPI = {
  // Public endpoints
  getPublicVendors: (page = 1, limit = 10) => 
    axiosInstance.get(`/public/vendors?page=${page}&limit=${limit}`),
  getPublicMenu: (vendorId) => axiosInstance.get(`/public/vendors/${vendorId}/menu`),
  getPublicMenuItem: (itemId) => axiosInstance.get(`/public/menu/${itemId}`),
  
  // Vendor endpoints
  getProfile: () => axiosInstance.get('/vendors/profile'),
  updateProfile: (data) => axiosInstance.put('/vendors/profile', data),
  toggleStatus: () => axiosInstance.post('/vendors/toggle-status'),
  
  // Menu management
  getMenuItems: () => axiosInstance.get('/vendors/menu'),
  addMenuItem: (data) => axiosInstance.post('/vendors/menu', data),
  updateMenuItem: (id, data) => axiosInstance.put(`/vendors/menu/${id}`, data),
  deleteMenuItem: (id) => axiosInstance.delete(`/vendors/menu/${id}`),
  toggleMenuItemAvailability: (id) => axiosInstance.post(`/vendors/menu/${id}/toggle`),
  
  // Orders
  getOrders: (status = '', page = 1, limit = 10) => 
    axiosInstance.get(`/vendors/orders?status=${status}&page=${page}&limit=${limit}`),
  getOrder: (id) => axiosInstance.get(`/vendors/orders/${id}`),
  acceptOrder: (id) => axiosInstance.post(`/vendors/orders/${id}/accept`),
  rejectOrder: (id, reason) => axiosInstance.post(`/vendors/orders/${id}/reject`, { reason }),
  markOrderReady: (id) => axiosInstance.post(`/vendors/orders/${id}/ready`),
  updateOrderStatus: (orderId, status) => 
    axiosInstance.post(`/vendors/orders/${orderId}/status`, { status }),
  
  // Earnings
  getEarnings: (startDate, endDate) => 
    axiosInstance.get(`/vendors/earnings?start_date=${startDate}&end_date=${endDate}`),
};

// Add to vendors.js API
// uploadImage remains outside default export to avoid modifying existing import patterns
export const uploadVendorImage = (formData) => {
  return axiosInstance.post('/vendors/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}