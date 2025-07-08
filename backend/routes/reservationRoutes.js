// backend/routes/reservationRoutes.js

const express = require("express");
const router = express.Router();

const {
  createReservation,
  getMyReservations,
  getReservationById,
  cancelReservation,
  getReservationByNumber,
  updateReservationStatus,
  updateReservationAdicionales,
  getTotalRevenue,
  getAllReservationsForReport, 
} = require("../controllers/reservationController");

const {
  processReservationPayment,
} = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");
router.get("/total-revenue", protect, getTotalRevenue);
router.get("/report", protect, getAllReservationsForReport);
// Nueva ruta para crear una reserva
router.route("/").post(protect, createReservation);

// Rutas para historial de reservas
router.route("/myreservations").get(protect, getMyReservations);

// Detalle reserva
router.route("/:id").get(protect, getReservationById);
// REMOVED: .delete(protect, cancelReservation); // <-- ELIMINA ESTA PARTE O COMENTALA

// Pagar reserva
router.route("/:id/pay").post(protect, processReservationPayment);

// NUEVA RUTA CORRECTA PARA CANCELAR RESERVA
// Método: PUT
// URL: /api/reservations/:id/cancel
router.route("/:id/cancel").put(protect, cancelReservation); // <-- AÑADE ESTA LÍNEA

router.route("/byNumber/:reservationNumber").get(protect, getReservationByNumber);

router.route("/:id/status").put(protect, updateReservationStatus);
router.route("/:id/adicionales").put(protect, updateReservationAdicionales);
module.exports = router;
