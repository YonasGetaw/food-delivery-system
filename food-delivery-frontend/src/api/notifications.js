import axiosInstance from './axios';

export const notificationsAPI = {
  list: (limit = 20) => axiosInstance.get(`/notifications?limit=${limit}`),
  unreadCount: () => axiosInstance.get('/notifications/unread-count'),
  markRead: (id) => axiosInstance.post(`/notifications/${id}/read`),
  markAllRead: () => axiosInstance.post('/notifications/read-all'),
};
