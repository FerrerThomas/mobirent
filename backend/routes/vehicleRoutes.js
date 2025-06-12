// backend/routes/vehicleRoutes.js

const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createVehicle,
  getAllVehicles,
  getAvailableVehicles,
  updateVehicleStatus,
  getVehicleById,
  getMaintenanceReport, // Importamos la función para el reporte
} = require("../controllers/vehicleController");

// --- Rutas de Vehículos Accesibles por CUALQUIER usuario (incluso no logueados) ---
router.get("/", getAvailableVehicles);

// --- Rutas de Gestión de Vehículos (Requieren autenticación y roles específicos) ---

// Ruta para OBTENER TODOS los vehículos (para el panel de admin/empleado)
// CORRECCIÓN: roles como argumentos separados por comas
router.get("/all", protect, authorize("admin", "employee"), getAllVehicles);

// Ruta para CREAR un nuevo vehículo: Requiere autenticación y rol de 'admin'
// CORRECCIÓN: roles como argumentos separados por comas
router.post("/", protect, authorize("admin"), createVehicle);

// Ruta para ACTUALIZAR el estado de un vehículo (mantenimiento o disponibilidad)
// CORRECCIÓN: roles como argumentos separados por comas
router.put(
  "/:id/status",
  protect,
  authorize("admin", "employee"),
  updateVehicleStatus
);

// --- Rutas de Reportes (Solo para Admin) ---
// CORRECCIÓN: roles como argumentos separados por comas y la ruta correcta
router.get(
  "/reports/maintenance",
  protect,
  authorize("admin"),
  getMaintenanceReport
);

// --- Ruta: Obtener un vehículo por ID ---
// CORRECCIÓN: roles como argumentos separados por comas
router.get(
  "/:id",
  protect,
  authorize("user", "employee", "admin"),
  getVehicleById
);

// --- Rutas antiguas/obsoletas - Considera eliminarlas si ya no las necesitas ---
// (Si estas líneas estaban comentadas, déjalas así o elimínalas si no se usan)
// router.post('/', protect, authorize('employee', 'admin'), addVehicle);
// router.delete('/:id', protect, authorize('employee', 'admin'), removeVehicle);
// router.get('/', protect, getVehicles);

module.exports = router;
