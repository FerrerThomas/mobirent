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
  pickupReservation,
  listAllReservations, // <-- ¡NUEVO: Importar la función!
} = require("../controllers/reservationController");

const {
  processReservationPayment,
} = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");
router.get("/all-reservations", protect, listAllReservations);
// Rutas de reportes (más específicas, deben ir antes de :id)
router.get("/total-revenue", protect, getTotalRevenue);
router.get("/report", protect, getAllReservationsForReport);
// Rutas para buscar por número de reserva (más específica que :id)
router
  .route("/byNumber/:reservationNumber")
  .get(protect, getReservationByNumber);

// ¡NUEVA RUTA PARA LA ENTREGA DE VEHÍCULOS (PICKUP)!
// Esta ruta es específica para marcar una reserva como retirada.
router
  .route("/:id/pickup")
  .put(protect, authorize("employee", "admin"), pickupReservation); // <-- ¡NUEVA RUTA!

// Rutas para crear una reserva
router.route("/").post(protect, createReservation);

// Rutas para historial de reservas del usuario
router.route("/myreservations").get(protect, getMyReservations);

// Rutas para el detalle de una reserva por ID (genérica, debe ir después de las más específicas)
router.route("/:id").get(protect, getReservationById);

// Pagar reserva
router.route("/:id/pay").post(protect, processReservationPayment);

// Ruta para cancelar reserva
router.route("/:id/cancel").put(protect, cancelReservation);

// Ruta para actualizar el estado de una reserva (para 'returned', 'completed', etc.)
router.route("/:id/status").put(protect, updateReservationStatus);

// Ruta para actualizar los adicionales de una reserva
router.route("/:id/adicionales").put(protect, updateReservationAdicionales);

module.exports = router;
