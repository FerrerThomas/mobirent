// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Configurar el transportador con las variables de entorno (.env)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // por ejemplo "gmail"
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Envía un email sencillo con asunto y HTML.
 * @param {string} to       - Dirección de destino (email del usuario)
 * @param {string} subject  - Asunto del correo
 * @param {string} html     - Contenido HTML del correo
 */
async function sendEmail({ to, subject, html }) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html
  };
  await transporter.sendMail(mailOptions);
}

/**
 * Envía un email de recordatorio de reserva.
 * @param {string} toEmail           - Dirección de email del destinatario.
 * @param {object} reservationDetails - Objeto con los detalles de la reserva.
 */
async function sendReminderEmail(toEmail, reservationDetails) {
  const { reservationNumber, vehicle, pickupDate, pickupBranch, returnDate, returnBranch } = reservationDetails;

  // Formatear las fechas para la visualización en el email
  const formattedPickupDate = new Date(pickupDate).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedReturnDate = new Date(returnDate).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const subject = `¡Recordatorio! Tu reserva ${reservationNumber} está próxima.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #007bff;">¡Hola! Tu reserva está a la vuelta de la esquina.</h2>
      <p>Solo para recordarte que tu reserva de vehículo se acerca.</p>
      <p><strong>Número de Reserva:</strong> ${reservationNumber}</p>
      <p><strong>Vehículo:</strong> ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})</p>
      <p><strong>Fecha de Retiro:</strong> ${formattedPickupDate}</p>
      <p><strong>Sucursal de Retiro:</strong> ${pickupBranch.name} - ${pickupBranch.address}</p>
      <p><strong>Fecha de Devolución:</strong> ${formattedReturnDate}</p>
      <p><strong>Sucursal de Devolución:</strong> ${returnBranch.name} - ${returnBranch.address}</p>
      <p>¡Esperamos verte pronto!</p>
      <p>Saludos cordiales,<br/>El equipo de Tu App de Alquiler de Vehículos</p>
      <p style="font-size: 0.8em; color: #777;">Este es un email automático, por favor no respondas a este correo.</p>
    </div>
  `;

  try {
    await sendEmail({ to: toEmail, subject, html });
    console.log(`Recordatorio enviado a ${toEmail} para reserva ${reservationNumber}`);
  } catch (error) {
    console.error(`Error al enviar recordatorio a ${toEmail}:`, error);
  }
}

// Exporta ambas funciones
module.exports = { sendEmail, sendReminderEmail };
