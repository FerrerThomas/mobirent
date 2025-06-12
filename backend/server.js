// backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicleRoutes");
const adminRoutes = require("./routes/adminRoutes"); // <-- NUEVO: Importa las rutas de admin
const branchRoutes = require("./routes/branchRoutes"); // Añade esta línea
const reservationRoutes = require("./routes/reservationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { startReminderJob } = require("./utils/cronJobs");
const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB Atlas'))
    .catch(err => console.error('❌ Error al conectar a MongoDB:', err.message));


app.use(
  cors({
    origin: "http://localhost:5173", // ¡Asegúrate de que este sea el puerto de tu frontend!
    methods: ["GET", "POST", "PUT", "DELETE"], // Métodos HTTP permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Cabeceras permitidas
  })
);

// --- Middleware para LOGUEAR TODAS las peticiones entrantes ---
app.use((req, res, next) => {
  console.log(`[REQ LOG] Método: ${req.method}, URL: ${req.url}`);
  next(); // Pasa la petición al siguiente middleware o ruta
});
// ---------------------------------------------------------------


// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/admin", adminRoutes); // <-- NUEVO: Para la gestión de admin
app.use("/api/reservations", reservationRoutes); // <-- ESTO ES CLAVE
app.use("/api/payments", paymentRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API de Mobirent corriendo...");
});

// --- Middleware para manejar rutas no encontradas (404) ---
// Este middleware solo se ejecutará si ninguna de las rutas anteriores manejó la petición
app.use((req, res, next) => {
  console.log(`[404 LOG] Ruta no encontrada: ${req.url}`);
  res
    .status(404)
    .json({ message: `Ruta '${req.url}' no encontrada en el API.` });
});
// --- INICIO: MIDDLEWARE DE MANEJO DE ERRORES ---
// Este middleware DEBE ir después de todas las rutas,
// ya que será el último en atrapar cualquier error que ocurra en las rutas anteriores.
app.use((err, req, res, next) => {
    // Si la respuesta ya tiene un código de estado (por ejemplo, 400, 401, 404, etc.), lo usa.
    // Si no, asume un error 500 (Error Interno del Servidor).
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Envía la respuesta en formato JSON
    res.json({
        message: err.message,
        // En desarrollo, puedes incluir el stack trace para depuración.
        // En producción, es mejor NO enviarlo por seguridad.
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});
// --- FIN: MIDDLEWARE DE MANEJO DE ERRORES ---

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => { 
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  
    startReminderJob();
    console.log('🔔 Tareas de recordatorio de email programadas iniciadas.');

  // 2. Llama directamente a la función de ejecución para probarla ahora:
  //console.log('🧪 Ejecutando tarea de recordatorio de email manualmente para prueba...');
  //await executeReminderJob(); // ¡Llamada directa!
  // --- FIN CAMBIOS PARA PRUEBA MANUAL ---
});
