import axiosInstance from './axios';

export const notificationsAPI = {
  list: (limit = 20) => axiosInstance.get(`/notifications?limit=${limit}`),
  markRead: (id) => axiosInstance.post(`/notifications/${id}/read`),
  markAllRead: () => axiosInstance.post('/notifications/read-all'),
};
