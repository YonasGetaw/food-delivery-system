import axiosInstance from './axios';

export const ridersAPI = {
  getProfile: () => axiosInstance.get('/riders/profile'),
  updateProfile: (data) => axiosInstance.put('/riders/profile', data),
  updateLocation: (lat, lng) => axiosInstance.post('/riders/location', { latitude: lat, longitude: lng }),
  toggleAvailability: () => axiosInstance.post('/riders/toggle-availability'),
  getAssignedOrders: (status = '') => axiosInstance.get(`/riders/orders?status=${status}`),
  getOrder: (id) => axiosInstance.get(`/riders/orders/${id}`),
  pickUpOrder: (id) => axiosInstance.post(`/riders/orders/${id}/pickup`),
  deliverOrder: (id) => axiosInstance.post(`/riders/orders/${id}/deliver`),
  getAvailableOrders: (page = 1, limit = 20) => axiosInstance.get(`/riders/available-orders?page=${page}&limit=${limit}`),
  claimOrder: (orderId) => axiosInstance.post(`/riders/orders/${orderId}/claim`),
  getEarnings: (startDate, endDate) => 
    axiosInstance.get(`/riders/earnings?start_date=${startDate}&end_date=${endDate}`),
  getDeliveryHistory: (page = 1, limit = 10) => 
    axiosInstance.get(`/riders/deliveries?page=${page}&limit=${limit}`),
};