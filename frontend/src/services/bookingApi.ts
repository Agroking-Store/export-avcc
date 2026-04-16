import api from './api';

const bookingApi = {
  create: (data: any) => api.post('/bookings', data),
  getAll: () => api.get('/bookings'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  getByDealer: (dealerId: string) => api.get(`/bookings/dealer/${dealerId}`),
  update: (id: string, data: any) => api.put(`/bookings/${id}`, data),
  confirm: (id: string) => api.patch(`/bookings/${id}/confirm`),
  delete: (id: string) => api.delete(`/bookings/${id}`),
  deleteByOrder: (orderId: string) => api.delete(`/bookings/order/${orderId}`),
};

export { bookingApi };