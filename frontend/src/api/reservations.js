// /frontend/src/api/reservations.js
import axios from "./axiosInstance";

// Crear reserva
export const createReservation = async (data) => {
  const response = await axios.post("/reservations", data);
  return response.data;
};

// Obtener mis reservas
export const getMyReservations = async () => {
  const response = await axios.get("/reservations/myreservations");
  return response.data;
};

// Obtener detalle de reserva
export const getReservationById = async (id) => {
  const response = await axios.get(`/reservations/${id}`);
  return response.data;
};

// Cancelar reserva
export const cancelReservation = async (id) => {
  const response = await axios.put(`/reservations/${id}/cancel`);
  return response.data;
};

//export const payReservation = async (reservationId, paymentData) => {
// La URL debe coincidir con la ruta de tu backend: /api/reservations/:id/pay
// y el backend espera un objeto { paymentData: ... }
//const response = await axios.post(`/api/reservations/${reservationId}/pay`, { paymentData });
//return response.data;
//};
