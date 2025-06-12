// backend/utils/cronJobs.js

const cron = require('node-cron');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Vehicle = require('../models/Vehicle');
// Asegúrate de que la ruta sea correcta, ya que ahora exportas ambas funciones
const { sendReminderEmail } = require('../services/emailService');

const executeReminderJob = async () => {
  console.log(`[${new Date().toISOString()}] Ejecutando tarea programada para recordatorios de reserva...`);

  const today = new Date();

  const reminderDate = new Date(today);
  reminderDate.setDate(today.getDate() + 2);
  reminderDate.setUTCHours(0, 0, 0, 0);

  const nextDayReminder = new Date(reminderDate);
  nextDayReminder.setUTCDate(reminderDate.getUTCDate() + 1);
  nextDayReminder.setUTCHours(0, 0, 0, 0);

  console.log(`DEBUG: Hora local actual: ${today.toLocaleString('es-AR')}`);
  console.log(`DEBUG: Ventana de recordatorio comienza (UTC): ${reminderDate.toISOString()}`);
  console.log(`DEBUG: Ventana de recordatorio termina (UTC): ${nextDayReminder.toISOString()}`);

  try {
    const upcomingReservations = await Reservation.find({
      status: 'confirmed',
      startDate: { // Esto es correcto, ya que el modelo usa 'startDate'
        $gte: reminderDate,
        $lt: nextDayReminder
      },
      reminderEmailSent: false,
    })
    .populate('user')
    .populate('vehicle')
    .populate('pickupBranch')
    .populate('returnBranch'); // Corrección de tipografía

    if (upcomingReservations.length === 0) {
      console.log(`[${new Date().toISOString()}] No hay reservas próximas para enviar recordatorios hoy.`);
      return;
    }

    console.log(`[${new Date().toISOString()}] Encontradas ${upcomingReservations.length} reservas para recordatorio.`);

    for (const reservation of upcomingReservations) {
      if (reservation.user && reservation.user.email) {
        console.log(`DEBUG: Procesando recordatorio para reserva ${reservation.reservationNumber}, usuario ${reservation.user.email}`);

        // --- CAMBIO CLAVE AQUÍ: Construir el objeto reservationDetails correctamente ---
        // Usamos startDate y endDate del modelo Reservation
        const reservationDetailsForEmail = {
          reservationNumber: reservation.reservationNumber,
          vehicle: reservation.vehicle,
          pickupDate: reservation.startDate, // Mapeamos startDate del modelo a pickupDate para el email
          pickupBranch: reservation.pickupBranch,
          returnDate: reservation.endDate,   // Mapeamos endDate del modelo a returnDate para el email
          returnBranch: reservation.returnBranch,
          // Opcional: Podrías añadir user.firstName, user.lastName si tu plantilla de email los usa
          userName: reservation.user.firstName || reservation.user.username, // o cualquier nombre que quieras usar
        };

        try {
          await sendReminderEmail(
            reservation.user.email,
            reservationDetailsForEmail // Pasamos el objeto completo
          );
          reservation.reminderEmailSent = true;
          await reservation.save();
          console.log(`Recordatorio enviado con éxito para reserva ${reservation._id} a ${reservation.user.email}.`);
        } catch (emailError) {
          console.error(`ERROR: Fallo al enviar el email de recordatorio para reserva ${reservation._id} a ${reservation.user.email}:`, emailError);
        }
      } else {
        console.warn(`ADVERTENCIA: No se pudo encontrar usuario o email para la reserva ${reservation._id}. No se envió recordatorio.`);
      }
    }
    console.log(`[${new Date().toISOString()}] Tarea de recordatorios finalizada. ${upcomingReservations.length} emails procesados.`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error en la tarea programada de recordatorios:`, error);
  }
};

module.exports = {
  startReminderJob: () => {
    cron.schedule('0 9 * * *', executeReminderJob, {
      timezone: "America/Argentina/Buenos_Aires"
    });
    console.log('Scheduler de recordatorios configurado para las 09:00 AM (hora de Buenos Aires).');
  },
  executeReminderJob
};