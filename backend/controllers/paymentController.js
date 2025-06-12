// backend/controllers/paymentController.js

const asyncHandler = require('express-async-handler');
const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const fakePaymentService = require('../services/fakePaymentService');

/**
 * @desc   Procesar el pago de una reserva existente
 * @route  POST /api/payments/:reservationId
 * @access Private (User)
 */
const processReservationPayment = asyncHandler(async (req, res) => {
  const { id: reservationId } = req.params;
  const { paymentData } = req.body;

  // --- NUEVOS LOGS DE DEPURACIÓN ---
  console.log('--- DEBUG: INICIANDO processReservationPayment ---');
  console.log(`DEBUG: reservationId recibido: ${reservationId}`);
  console.log('DEBUG: paymentData recibido:', paymentData);
  // --- FIN NUEVOS LOGS ---

  if (!paymentData) {
    res.status(400);
    throw new Error('Los datos de pago (paymentData) son obligatorios.');
  }

  // 1. Verificar que la reserva exista
   const reservation = await Reservation.findById(reservationId)
    .populate('vehicle')
    .populate('user')
    .populate('pickupBranch') // <-- ¡Añade esta línea!
    .populate('returnBranch'); // <-- ¡Añade esta línea!

  if (!reservation) {
    res.status(404);
    throw new Error('Reserva no encontrada.');
  }
  

  // 2. Solo permitir pago si la reserva está en "pending"
  if (reservation.status !== 'pending') {
    res.status(400);
    throw new Error('Solo se puede pagar una reserva en estado "pending".');
  }
  console.log('DEBUG: Reserva está en estado pending.');
  
  // 3. Verificar que no hayan pasado más de 30 minutos desde createdAt
  const now = new Date();
  const createdAt = reservation.createdAt;
  const thirtyMinutes = 30 * 60 * 1000;
  if (now - createdAt > thirtyMinutes) {
    // Luego de 30 min, liberar vehículo y marcar reserva como cancelada
    reservation.status = 'cancelled';
    reservation.paymentInfo.status = 'pending';
    await reservation.save();

    // Si el vehículo estaba bloqueado antes, liberarlo
    if (reservation.vehicle.isReserved) {
      reservation.vehicle.isReserved = false;
      await reservation.vehicle.save();
    }

    res.status(400);
    throw new Error('Tiempo de pago expirado (30 min). La reserva ha sido cancelada.');
  }
  console.log('DEBUG: Reserva dentro del plazo de 30 minutos.');


  // 4. Procesar el pago simulado
  let paymentResult;
  try {
    paymentResult = await fakePaymentService.processPayment(paymentData, reservation.totalCost);
  } catch (err) {
    console.error('Error técnico al llamar a fakePaymentService:', err);
    res.status(500);
    throw new Error('Error técnico, intente más tarde.');
  }

  // 5. Según el estado del fakePaymentService:
  if (paymentResult.status === 'rejected') {
    console.log('DEBUG: Pago rechazado por fakePaymentService.');
    // a) Pago rechazado → mantener estado "pending"
    reservation.paymentInfo = {
      transactionId: paymentResult.transactionId,
      method: paymentData.method || 'credit_card',
      status: 'rejected',
    };
    await reservation.save();

    res.status(400).json({ message: paymentResult.message });
    return;
  }

  // 6. Si status === 'approved', confirmar reserva:
  if (paymentResult.status === 'approved') {
    console.log('DEBUG: Pago aprobado por fakePaymentService. Confirmando reserva...');
    // a) Cambiar reserva a "confirmed"
    reservation.status = 'confirmed';
    reservation.paymentInfo = {
      transactionId: paymentResult.transactionId,
      method: paymentData.method || 'credit_card',
      status: 'approved',
    };
    await reservation.save();
    console.log('DEBUG: Reserva actualizada a "confirmed".');

    // b) Marcar el vehículo como reservado
    const vehicle = await Vehicle.findById(reservation.vehicle._id);
    if (vehicle) {
      vehicle.isReserved = true;
      await vehicle.save();
      console.log('DEBUG: Vehículo marcado como "isReserved".');
    } else {
      console.warn('ADVERTENCIA: Vehículo no encontrado para marcar como reservado.');
    }

    // c) Enviar voucher por email
    // Aquí, ya populamos 'user' en la reserva, así que `reservation.user` debería tener todos los datos.
    // No es necesario hacer `await User.findById(reservation.user);` de nuevo si ya populaste.
    const user = reservation.user; // Usamos el usuario populado directamente
    if (user) {
      console.log(`DEBUG: Preparando envío de email para usuario: ${user.email}`);
      const userNameFormatted = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username || user.email.split('@')[0];

      const vehicleDetails = reservation.vehicle ? `${reservation.vehicle.brand} ${reservation.vehicle.model} (${reservation.vehicle.licensePlate})` : 'N/A';
      const pickupBranchName = reservation.pickupBranch ? `${reservation.pickupBranch.name} (${reservation.pickupBranch.address})` : 'N/A';
      const returnBranchName = reservation.returnBranch ? `${reservation.returnBranch.name} (${reservation.returnBranch.address})` : 'N/A';
      const startDateFormatted = new Date(reservation.startDate).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
      const endDateFormatted = new Date(reservation.endDate).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });


      const voucherHtml = `
        <h1>¡Tu Reserva en Mobirent ha sido Confirmada!</h1>
        <p>Estimado(a) <strong>${userNameFormatted}</strong>,</p>
        <p>Nos complace informarte que tu pago ha sido procesado con éxito y tu reserva ha sido confirmada.</p>
        <p><strong>Detalles de tu Reserva:</strong></p>
        <ul>
          <li><strong>Número de Reserva:</strong> ${reservation.reservationNumber}</li>
          <li><strong>Vehículo:</strong> ${vehicleDetails}</li>
          <li><strong>Fechas de Retiro:</strong> ${startDateFormatted}</li>
          <li><strong>Fechas de Devolución:</strong> ${endDateFormatted}</li>
          <li><strong>Sucursal de Retiro:</strong> ${pickupBranchName}</li>
          <li><strong>Sucursal de Devolución:</strong> ${returnBranchName}</li>
          <li><strong>Costo Total Pagado:</strong> ARS ${reservation.totalCost.toFixed(2)}</li>
          <li><strong>Estado:</strong> ${reservation.status.toUpperCase()}</li>
        </ul>
        <p>Puedes ver los detalles de tu reserva en cualquier momento iniciando sesión en tu cuenta de Mobirent.</p>
        <p>¡Gracias por elegir Mobirent! ¡Que disfrutes tu viaje!</p>
        <p>Atentamente, <br/>El equipo de Mobirent</p>
      `;

      try {
        await sendEmail( // sendEmail ahora espera un objeto como argumento
          user.email, // El primer argumento es 'to' (email del destinatario)
          `Voucher de Confirmación de Reserva - ${reservation.reservationNumber}`, // El segundo es 'subject'
          voucherHtml // El tercero es 'htmlContent'
        );
        reservation.voucherSent = true;
        await reservation.save();
        console.log('DEBUG: Voucher de email enviado y voucherSent actualizado en la reserva.');
      } catch (err) {
        console.error('ERROR: Fallo al enviar voucher:', err);
        // No abortamos la respuesta, porque el pago sí fue aprobado.
      }
    } else {
      console.warn('ADVERTENCIA: No se pudo encontrar el usuario para enviar el email del voucher.');
    }
    // d) Devolver respuesta exitosa
    res.status(200).json({
      message: 'Pago aprobado, reserva confirmada.',
      reservationId: reservation._id,
      reservationNumber: reservation.reservationNumber,
      totalCost: reservation.totalCost,
      paymentInfo: reservation.paymentInfo,
      status: reservation.status,
    });
    console.log('--- DEBUG: processReservationPayment finalizado exitosamente ---');
    return;
  }

 // 7. Si retorna 'pending' del fakePaymentService
  if (paymentResult.status === 'pending') {
    console.log('DEBUG: Pago en proceso o pendiente por fakePaymentService.');
    reservation.paymentInfo = {
      transactionId: paymentResult.transactionId,
      method: paymentData.method || 'credit_card',
      status: 'pending',
    };
    await reservation.save();
    res.status(200).json({
      message: 'Pago en proceso. Te notificaremos cuando se confirme.',
      status: 'pending',
      reservationId: reservation._id,
      reservationNumber: reservation.reservationNumber,
    });
    return;
  }

  // Caso inesperado
  res.status(500);
  throw new Error('Estado de pago inesperado.');
});

module.exports = {
  processReservationPayment,
};


