// backend/controllers/reservationController.js

const asyncHandler = require("express-async-handler");
const Reservation = require("../models/Reservation");
const Vehicle = require("../models/Vehicle");
const Branch = require("../models/Branch");
const Adicional = require("../models/Adicional");
const User = require("../models/User"); // Asegúrate de que User está importado para el email
const sendEmail = require("../utils/sendEmail");
const fakePaymentService = require("../services/fakePaymentService");
const { calculateRefund } = require("../services/refundService"); // Importar el servicio de reembolso

// Helper para calcular el costo total (mantener si se usa en createReservation)
const calculateTotalCost = (startDate, endDate, vehiclePricePerDay) => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * vehiclePricePerDay;
};

// Helper para recalcular el costo total de la reserva incluyendo adicionales
const recalculateReservationTotalCost = async (reservation) => {
    // Si la reserva no tiene vehicle o no tiene pricePerDay, manejar el error o devolver el costo actual
    if (!reservation.vehicle || !reservation.vehicle.pricePerDay) {
        console.warn('Advertencia: Vehículo o pricePerDay no disponibles para recalcular el costo base.');
        // Considera si quieres lanzar un error o mantener el costo actual en este caso
        return reservation.totalCost; // Devuelve el costo actual si no se puede recalcular base
    }

    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const durationInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let recalculatedTotal = durationInDays * reservation.vehicle.pricePerDay; // Costo base del vehículo

    // Suma el costo de todos los adicionales
    if (reservation.adicionales && reservation.adicionales.length > 0) {
        for (const item of reservation.adicionales) {
            // Asegúrate de usar itemPrice que es el precio al momento de la asignación
            recalculatedTotal += item.itemPrice * item.quantity;
        }
    }
    return recalculatedTotal;
};


/**
 * @desc    Crear una nueva reserva en ESTADO PENDING (sin procesar pago)
 * @route   POST /api/reservations
 * @access Private (User)
 * NOTA: Esta función podría ser modificada en el futuro si se decide que las reservas
 * solo existen si están confirmadas, como se discutió anteriormente.
 */
const createReservation = asyncHandler(async (req, res) => {
  const { vehicleId, pickupBranchId, returnBranchId, startDate, endDate } =
    req.body;

  // 1) Validar campos obligatorios
  if (
    !vehicleId ||
    !pickupBranchId ||
    !returnBranchId ||
    !startDate ||
    !endDate
  ) {
    res.status(400);
    throw new Error(
      "Faltan datos obligatorios: vehículo, sucursales y fechas."
    );
  }

  // Normalizar fechas a inicio del día en UTC para comparaciones precisas
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  // Obtener el día de hoy en UTC
  const todayUTC = new Date(
    Date.UTC(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    )
  );

  // Obtener la fecha de inicio de la reserva en UTC
  const startDateUTC = new Date(
    Date.UTC(
      parsedStartDate.getFullYear(),
      parsedStartDate.getMonth(),
      parsedStartDate.getDate()
    )
  );

  // Comparar las fechas normalizadas en UTC
  if (startDateUTC < todayUTC) {
    res.status(400);
    throw new Error("La fecha de inicio no puede ser anterior a hoy.");
  }
  if (parsedStartDate >= parsedEndDate) {
    res.status(400);
    throw new Error("La fecha de fin debe ser posterior a la fecha de inicio.");
  }

  // 2) Verificar existencia y estado de vehículo y sucursales
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    res.status(404);
    throw new Error("Vehículo no encontrado.");
  }

  const pickupBranch = await Branch.findById(pickupBranchId);
  const returnBranch = await Branch.findById(returnBranchId);
  if (!pickupBranch || !returnBranch) {
    res.status(404);
    throw new Error("Sucursal de retiro o devolución no encontrada.");
  }

  // 3) Verificar disponibilidad del vehículo
  if (vehicle.needsMaintenance) {
    res.status(400);
    throw new Error("Vehículo en mantenimiento. Elige otro.");
  }
  // Si isAvailable o isReserved son flags en el modelo
  if (!vehicle.isAvailable || vehicle.isReserved) {
    res.status(400);
    throw new Error("Vehículo no disponible o ya reservado.");
  }

  // 4) Revisar reservas superpuestas
  const overlappingReservations = await Reservation.find({
    vehicle: vehicleId,
    status: { $in: ["pending", "confirmed", "picked_up"] }, // Aquí se siguen considerando 'pending'
    $or: [
      { startDate: { $lt: parsedEndDate, $gte: parsedStartDate } },
      { endDate: { $gt: parsedStartDate, $lte: parsedEndDate } },
      {
        startDate: { $lte: parsedStartDate },
        endDate: { $gte: parsedEndDate },
      },
    ],
  });
  if (overlappingReservations.length > 0) {
    res.status(400);
    throw new Error(
      "Ya existe una reserva superpuesta para ese vehículo y fechas."
    );
  }

  // 5) Calcular costo total
  const totalCost = calculateTotalCost(
    parsedStartDate,
    parsedEndDate,
    vehicle.pricePerDay
  );
  if (totalCost <= 0) {
    res.status(400);
    throw new Error("El costo total debe ser positivo.");
  }

  // 6) Crear la reserva en estado "pending"
  const newReservation = await Reservation.create({
    user: req.user._id,
    vehicle: vehicleId,
    pickupBranch: pickupBranchId,
    returnBranch: returnBranchId,
    startDate: parsedStartDate,
    endDate: parsedEndDate,
    totalCost,
    status: "pending",
    paymentInfo: {
      transactionId: null,
      method: null,
      status: null,
    },
    reservationNumber: null, // el hook pre('save') lo genera automáticamente
  });

  res.status(201).json({
    message: "Reserva creada en estado pendiente. Ahora debes pagar.",
    reservationId: newReservation._id,
    reservationNumber: newReservation.reservationNumber,
    totalCost: newReservation.totalCost,
    status: newReservation.status,
  });
});

/**
 * @desc    Obtener todas las reservas del usuario
 * @route   GET /api/reservations/myreservations
 * @access  Private (User)
 */
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id })
    .populate("vehicle")
    .populate("pickupBranch")
    .populate("returnBranch");
  res.status(200).json(reservations);
});

/**
 * @desc    Obtener detalle de una reserva
 * @route   GET /api/reservations/:id
 * @access  Private (User)
 */
const getReservationById = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate("user", "username email")
    .populate("vehicle", "brand model licensePlate pricePerDay photoUrl needsMaintenance isAvailable isReserved")
    .populate("pickupBranch", "name address")
    .populate("returnBranch", "name address")
    .populate("adicionales.adicional", "name price description"); // <-- AÑADE ESTA LÍNEA PARA POPULAR ADICIONALES

  if (!reservation) {
    res.status(404);
    throw new Error("Reserva no encontrada.");
  }
  res.status(200).json(reservation);
});

/**
 * @desc    Procesar pago de una reserva existente
 * @route   POST /api/reservations/:id/pay
 * @access  Private (usuario dueño de la reserva)
 */
const payReservation = asyncHandler(async (req, res) => {
  console.log("****** DEBUG: INICIANDO payReservation CONTROLLER ******");
  console.log("****** DEBUG: Request Params ID:", req.params.id);
  console.log("****** DEBUG: Request Body:", req.body);
  console.log("****** DEBUG: User ID:", req.user._id);
  const reservationId = req.params.id;
  const { paymentData } = req.body;
  const userId = req.user._id;

  // 1) Validar que vengan todos los campos dentro de paymentData
  if (
    !paymentData ||
    !paymentData.cardNumber ||
    !paymentData.expiry ||
    !paymentData.cvv ||
    !paymentData.method
  ) {
    res.status(400);
    throw new Error(
      "Faltan datos de la tarjeta: cardNumber, expiry, cvv y method son obligatorios."
    );
  }

  // 2) Buscar la reserva
  const reservation = await Reservation.findById(reservationId)
    .populate("vehicle")
    .populate("pickupBranch")
    .populate("returnBranch")
    .populate("user");
  if (!reservation) {
    res.status(404);
    throw new Error("Reserva no encontrada.");
  }

  console.log(
    "[PAY] Antes de pagar, estado en BD:",
    reservation.status,
    " createdAt:",
    reservation.createdAt
  );

  // 3) Verificar que el usuario propietario sea el que paga
  if (reservation.user._id.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("No autorizado para pagar esta reserva.");
  }

  // 4) Solo permitir pago si está “pending” y dentro de los primeros 30 minutos
  if (reservation.status !== "pending") {
    res.status(400);
    throw new Error("Esta reserva ya no está pendiente de pago.");
  }
  const now = new Date();
  const createdAt = new Date(reservation.createdAt);
  if (now - createdAt > 30 * 60 * 1000) {
    // si pasaron más de 30 minutos, cancelar la reserva y liberar vehículo
    reservation.status = "cancelled";
    // CAMBIO: Asegúrate de que paymentInfo.status también refleje el rechazo por tiempo
    reservation.paymentInfo.status = "rejected";
    await reservation.save();
    res.status(400); // Re-setear status para el throw
    throw new Error(
      "Se venció el plazo de pago (30 min). La reserva ha sido cancelada."
    );
  }

  // 5) Procesar el pago simulado
  const monto = reservation.totalCost;
  const resultado = await fakePaymentService.processPayment(paymentData, monto);

  if (resultado.status === "rejected") {
    // 6b) Pago rechazado: la reserva sigue “pending” y guardamos el intento
    reservation.paymentInfo = {
      transactionId: resultado.transactionId,
      method: paymentData.method,
      status: "rejected",
    };
    await reservation.save();

    return res.status(400).json({
      message: "Pago rechazado, intenta con otra tarjeta.",
      status: "rejected",
    });
  }

  if (resultado.status === "pending") {
    // 6c) Pago en proceso (estado intermedio)
    reservation.paymentInfo = {
      transactionId: resultado.transactionId,
      method: paymentData.method,
      status: "pending",
    };
    await reservation.save();

    return res.status(200).json({
      message: "Pago en proceso. Te notificaremos cuando se confirme.",
      status: "pending",
    });
  }

  // 6a) Si status === 'approved'
  reservation.status = "confirmed";
  console.log("[PAY] Branch aprobado: marcando status = confirmed");
  reservation.paymentInfo = {
    transactionId: resultado.transactionId,
    method: paymentData.method,
    status: "approved",
  };
  reservation.voucherSent = true; // ¡Asegúrate de marcar esto!
  await reservation.save();

  // 7) Marcar vehículo como reservado
  const vehiculo = await Vehicle.findById(reservation.vehicle._id);
  if (vehiculo) {
    vehiculo.isReserved = true;
    // Si el vehículo estaba en mantenimiento y sale de allí al ser reservado (no es el flujo normal, pero por si acaso)
    // vehiculo.needsMaintenance = false;
    // vehiculo.maintenanceReason = null;
    // vehiculo.maintenanceStartDate = null;
    vehiculo.isAvailable = false; // Un vehículo reservado no está disponible para otros
    await vehiculo.save();
    console.log("[PAY] Después de save(), estado en BD:", reservation.status);
  }

  // 8) Enviar voucher por correo
  try {
    const userEmail = reservation.user.email;
    const userName =
      reservation.user.username || reservation.user.email.split("@")[0]; // Usa el username o la parte antes del @
    const vehicleDetails = reservation.vehicle
      ? `${reservation.vehicle.brand} ${reservation.vehicle.model} (${reservation.vehicle.licensePlate})`
      : "N/A";
    const pickupBranchName = reservation.pickupBranch
      ? `${reservation.pickupBranch.name} (${reservation.pickupBranch.address})`
      : "N/A";
    const returnBranchName = reservation.returnBranch
      ? `${reservation.returnBranch.name} (${reservation.returnBranch.address})`
      : "N/A";

    // Formateo de fechas para el email
    const startDateFormatted = new Date(
      reservation.startDate
    ).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const endDateFormatted = new Date(reservation.endDate).toLocaleDateString(
      "es-AR",
      { year: "numeric", month: "long", day: "numeric" }
    );

    const voucherHtml = `
            <h1>¡Tu Reserva en Mobirent ha sido Confirmada!</h1>
            <p>Estimado(a) <strong>${userName}</strong>,</p>
            <p>Nos complace informarte que tu pago ha sido procesado con éxito y tu reserva ha sido confirmada.</p>
            <p><strong>Detalles de tu Reserva:</strong></p>
            <ul>
                <li><strong>Número de Reserva:</strong> ${
                  reservation.reservationNumber
                }</li>
                <li><strong>Vehículo:</strong> ${vehicleDetails}</li>
                <li><strong>Fechas de Retiro:</strong> ${startDateFormatted}</li>
                <li><strong>Fechas de Devolución:</strong> ${endDateFormatted}</li>
                <li><strong>Sucursal de Retiro:</strong> ${pickupBranchName}</li>
                <li><strong>Sucursal de Devolución:</strong> ${returnBranchName}</li>
                <li><strong>Costo Total Pagado:</strong> ARS ${reservation.totalCost.toFixed(
                  2
                )}</li>
                <li><strong>Estado:</strong> ${reservation.status.toUpperCase()}</li>
            </ul>
            <p>Puedes ver los detalles de tu reserva en cualquier momento iniciando sesión en tu cuenta de Mobirent.</p>
            <p>¡Gracias por elegir Mobirent! ¡Que disfrutes tu viaje!</p>
            <p>Atentamente, <br/>El equipo de Mobirent</p>
        `;

    console.log(
      `DEBUG: Intentando enviar voucher a ${userEmail} para reserva ${reservation.reservationNumber}`
    );
    console.log(
      `DEBUG: Asunto del email: Voucher de Confirmación de Reserva - ${reservation.reservationNumber}`
    );

    await sendEmail(
      reservation.user.email,
      `Voucher de Confirmación de Reserva - ${reservation.reservationNumber}`,
      voucherHtml
    );

    console.log(`DEBUG: La función sendEmail terminó de ejecutarse sin error.`);
  } catch (mailErr) {
    console.error(
      "ERROR CRÍTICO: Fallo en el envío de voucher (catch block):",
      mailErr
    );
  }

  return res.status(200).json({
    message: "Pago aprobado y reserva confirmada.",
    status: "approved",
  });
});

/**
 * @desc    Cancelar una reserva y calcular/processar reembolso
 * @route   PUT /api/reservations/:id/cancel
 * @access  Private (usuario dueño de la reserva)
 */
const cancelReservation = asyncHandler(async (req, res) => {
  const reservationId = req.params.id;
  const userId = req.user._id;

  // 1) Buscar la reserva y poblarla con vehicle y user
  const reservation = await Reservation.findById(reservationId)
    .populate("vehicle") // Necesitamos detalles del vehículo para liberarlo si es necesario
    .populate("user", "username email"); // Necesitamos el email del usuario para el correo

  if (!reservation) {
    res.status(404);
    throw new Error("Reserva no encontrada.");
  }

  // 2) Verificar que el usuario propietario sea el que cancela
  if (reservation.user._id.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("No autorizado para cancelar esta reserva.");
  }

  // 3) Verificar estado permitido (solo "confirmed")
  // Consideramos que 'picked_up' o 'returned' no se pueden cancelar con reembolso.
  if (reservation.status !== "confirmed") {
    res.status(400);
    throw new Error(
      `La reserva no puede ser cancelada en estado "${reservation.status}".`
    );
  }

  // 4) Calcular reembolso
  const refundAmount = calculateRefund(
    reservation.startDate,
    reservation.totalCost
  );

  // 5) Actualizar campos de cancelación
  reservation.status = "cancelled";
  reservation.canceledAt = new Date(); // Asigna la fecha y hora actual de la cancelación
  reservation.refundAmount = refundAmount;
  await reservation.save();

  // 6) Liberar disponibilidad del vehículo
  // Solo si el vehículo estaba marcado como reservado (lo cual ocurre al CONFIRMAR la reserva)
  const vehicle = await Vehicle.findById(reservation.vehicle._id);
  if (vehicle && vehicle.isReserved) {
    // Si el vehículo fue populado y estaba marcado como reservado
    vehicle.isReserved = false;
    // Opcional: Si el vehículo se marcó como no disponible al reservar, volver a disponible.
    // Asume que al liberar la reserva, el vehículo vuelve a ser "disponible" a menos que esté en mantenimiento.
    if (!vehicle.needsMaintenance) {
      // Solo si no está en mantenimiento
      vehicle.isAvailable = true;
    }
    await vehicle.save();
  }

  // 7) Enviar email de confirmación de cancelación con detalles y monto de reembolso
  const refundType =
    refundAmount === reservation.totalCost
      ? "Total (100%)"
      : refundAmount > 0 && refundAmount < reservation.totalCost
      ? "Parcial (80% del costo total)"
      : "Sin reembolso";

  const vehicleDetailsEmail = reservation.vehicle
    ? `${reservation.vehicle.brand} ${reservation.vehicle.model} (${reservation.vehicle.licensePlate})`
    : "N/A";
  const pickupBranchNameEmail = reservation.pickupBranch
    ? `${reservation.pickupBranch.name}`
    : "N/A";
  const returnBranchNameEmail = reservation.returnBranch
    ? `${reservation.returnBranch.name}`
    : "N/A";
  const startDateFormattedEmail = new Date(
    reservation.startDate
  ).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const endDateFormattedEmail = new Date(
    reservation.endDate
  ).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const userName =
    reservation.user.username || reservation.user.email.split("@")[0];

  const correoHtml = `
        <h1>Confirmación de Cancelación de Reserva - Mobirent</h1>
        <p>Estimado(a) <strong>${userName}</strong>,</p>
        <p>Te confirmamos que tu reserva <strong>#${
          reservation.reservationNumber
        }</strong> para el vehículo ${vehicleDetailsEmail} ha sido cancelada exitosamente.</p>
        <p><strong>Detalles de la Reserva Cancelada:</strong></p>
        <ul>
            <li><strong>Número de Reserva:</strong> ${
              reservation.reservationNumber
            }</li>
            <li><strong>Vehículo:</strong> ${vehicleDetailsEmail}</li>
            <li><strong>Fechas de Retiro:</strong> ${startDateFormattedEmail}</li>
            <li><strong>Fechas de Devolución:</strong> ${endDateFormattedEmail}</li>
            <li><strong>Sucursal de Retiro:</strong> ${pickupBranchNameEmail}</li>
            <li><strong>Sucursal de Devolución:</strong> ${returnBranchNameEmail}</li>
            <li><strong>Costo Total de la Reserva:</strong> ARS ${reservation.totalCost.toFixed(
              2
            )}</li>
            <li><strong>Estado de la Reserva:</strong> CANCELADA</li>
        </ul>
        <p><strong>Detalle del Reembolso:</strong></p>
        <ul>
            <li><strong>Monto a Reembolsar:</strong> ARS ${refundAmount.toFixed(
              2
            )}</li>
            <li><strong>Tipo de Reembolso:</strong> ${refundType}</li>
        </ul>
        <p>El reembolso se procesará según nuestra política de cancelaciones.</p>
        <p>Lamentamos que no puedas continuar con tu reserva. Esperamos verte pronto.</p>
        <p>Atentamente, <br/>El equipo de Mobirent</p>
    `;

  try {
    await sendEmail(
      reservation.user.email, // Destinatario
      `Confirmación de Cancelación - Reserva #${reservation.reservationNumber}`, // Asunto
      correoHtml // Contenido HTML
    );
    console.log(
      `Email de cancelación con reembolso enviado a ${reservation.user.email} para reserva ${reservation.reservationNumber}`
    );
  } catch (mailErr) {
    console.error("Error al enviar email de cancelación:", mailErr);
  }

  // 8) Respuesta al frontend
  res.status(200).json({
    message: "Reserva cancelada con éxito.",
    refundAmount: refundAmount, // <-- INCLUIR EN LA RESPUESTA
    refundType: refundType, // <-- INCLUIR EN LA RESPUESTA
    reservationId: reservation._id,
    status: "cancelled",
  });
});

//-------- tomi 28/06
const getReservationByNumber = asyncHandler(async (req, res) => {
  const reservationNumber = req.params.reservationNumber;
  const reservation = await Reservation.findOne({ reservationNumber })
    .populate("user", "username email")
    .populate("vehicle", "brand model licensePlate pricePerDay photoUrl needsMaintenance isAvailable isReserved")
    .populate("pickupBranch", "name address")
    .populate("returnBranch", "name address")
    .populate("adicionales.adicional", "name price description"); // <-- AÑADE ESTA LÍNEA

  if (!reservation) {
    res.status(404);
    throw new Error("Reserva no encontrada con ese número.");
  }
  res.status(200).json(reservation);
});


/**
 * @desc    Actualizar el estado de una reserva (y añadir adicionales si se pasa a 'picked_up')
 * @route   PUT /api/reservations/:id/status
 * @access  Private (Admin, Employee)
 */
const updateReservationStatus = asyncHandler(async (req, res) => {
  const reservationId = req.params.id;
  const { status } = req.body; // <-- Ya NO recibe 'adicionales' aquí
  const userId = req.user._id; // Para validación de usuario si es necesario

  const reservation = await Reservation.findById(reservationId).populate('vehicle'); // Popula el vehículo para acceder a su precio

  if (!reservation) {
    res.status(404);
    throw new Error("Reserva no encontrada.");
  }

  // Opcional: Validaciones de rol (ej. solo admin/empleado puede cambiar estados clave)
  // Asegúrate de que tu ruta (`reservationRoutes.js`) tenga el middleware `protect` y `authorize(['admin', 'employee'])`
  // if (req.user.role !== 'admin' && req.user.role !== 'employee') {
  //   res.status(403);
  //   throw new Error("No autorizado para gestionar el estado de las reservas.");
  // }


  // Lógica para añadir adicionales y recalcular costo SOLO cuando el estado es 'picked_up'
  // >>>>>>>>> ESTE BLOQUE HA SIDO ELIMINADO/MOVIDO A updateReservationAdicionales <<<<<<<<<<
  // if (status === 'picked_up') {
  //   // ... lógica de adicionales eliminada ...
  // }

  // Validaciones de transición de estado (esto ya lo tienes)
  const allowedTransitions = {
    'pending': ['confirmed', 'cancelled'], // Asume que 'pending' a 'picked_up' no es directo
    'confirmed': ['picked_up', 'cancelled'],
    'picked_up': ['returned'],
    'returned': ['completed'],
  };

  if (!allowedTransitions[reservation.status] || !allowedTransitions[reservation.status].includes(status)) {
    res.status(400);
    throw new Error(`Transición de estado inválida de '${reservation.status}' a '${status}'.`);
  }

  // Actualiza el estado de la reserva
  reservation.status = status;

  // Lógica específica para el vehículo según el nuevo estado (ajustado de conversaciones previas)
  const vehicle = await Vehicle.findById(reservation.vehicle._id);
  if (!vehicle) {
    res.status(404);
    throw new Error("Vehículo asociado a la reserva no encontrado.");
  }

  // Si el estado es 'picked_up', marcar vehículo como no disponible/reservado
  if (status === 'picked_up') {
    vehicle.isReserved = true; // El vehículo ya fue confirmado, ahora se retira físicamente
    vehicle.isAvailable = false; // Ya no está disponible
    // Si la reserva se pasó a picked_up, y el vehículo estaba en mantenimiento, lo sacamos de mantenimiento.
    // Esto es un flujo potencial, depende de tu lógica de negocio.
    // if (vehicle.needsMaintenance) {
    //   vehicle.needsMaintenance = false;
    //   vehicle.maintenanceReason = null;
    //   vehicle.maintenanceStartDate = null;
    // }
  }

  // Si el estado es 'returned', marcar vehículo como necesitando mantenimiento (y liberar de reservado)
  if (status === 'returned') {
    const { maintenanceReason } = req.body; // Aquí SÍ se espera el motivo de mantenimiento
    if (!maintenanceReason || maintenanceReason.trim() === '') {
      res.status(400);
      throw new Error('El motivo de mantenimiento es obligatorio al marcar la reserva como devuelta.');
    }
    vehicle.needsMaintenance = true;
    vehicle.maintenanceReason = maintenanceReason;
    vehicle.maintenanceStartDate = new Date(); // Registra cuándo se marca para mantenimiento
    vehicle.isReserved = false; // Ya no está reservado por esta reserva
    vehicle.isAvailable = false; // No está disponible si necesita mantenimiento
  }

  // Si el estado es 'cancelled', liberar vehículo (si estaba reservado)
  if (status === 'cancelled') {
    if (vehicle.isReserved) {
      vehicle.isReserved = false;
      if (!vehicle.needsMaintenance) { // Solo si no necesita mantenimiento por otra razón
        vehicle.isAvailable = true;
      }
    }
  }


  // Guarda la reserva con el nuevo estado y los adicionales/costo actualizados
  await reservation.save();
  await vehicle.save(); // Guarda también el vehículo si su estado cambió

  res.status(200).json({
    message: `Estado de la reserva actualizado a '${reservation.status}'.`,
    reservation, // Retorna la reserva actualizada
  });
});


/**
 * @desc    Actualizar los adicionales de una reserva y recalcular su costo.
 * @route   PUT /api/reservations/:id/adicionales
 * @access  Private (Admin, Employee)
 */
const updateReservationAdicionales = asyncHandler(async (req, res) => {
    const reservationId = req.params.id;
    const { adicionales: newAdicionalesData } = req.body; // Array de { adicionalId, quantity }

    // 1. Buscar la reserva y poblar el vehículo para su precio base
    const reservation = await Reservation.findById(reservationId).populate('vehicle');

    if (!reservation) {
        res.status(404);
        throw new Error("Reserva no encontrada.");
    }

    // 2. Validar que la reserva esté en un estado donde se puedan modificar adicionales
    // Por ejemplo, 'confirmed' o 'picked_up'. No si está 'cancelled' o 'returned' ya.
    const allowedStatuses = ['pending', 'confirmed', 'picked_up'];
    if (!allowedStatuses.includes(reservation.status)) {
        res.status(400);
        throw new Error(`No se pueden modificar adicionales en el estado actual de la reserva: ${reservation.status}.`);
    }

    // 3. Procesar y validar los nuevos datos de adicionales
    let validatedAdicionales = [];
    if (newAdicionalesData && newAdicionalesData.length > 0) {
        for (const item of newAdicionalesData) {
            if (!item.adicionalId || item.quantity === undefined || item.quantity < 0) {
                res.status(400);
                throw new Error('Datos de adicional inválidos: ID o cantidad faltante/inválida. La cantidad no puede ser negativa.');
            }
            if (item.quantity === 0) {
                // Si la cantidad es 0, simplemente lo omitimos de la lista final
                continue;
            }

            const existingAdicional = await Adicional.findById(item.adicionalId);
            if (!existingAdicional) {
                res.status(404);
                throw new Error(`Adicional con ID ${item.adicionalId} no encontrado.`);
            }

            validatedAdicionales.push({
                adicional: existingAdicional._id,
                quantity: item.quantity,
                itemPrice: existingAdicional.price, // Captura el precio actual del adicional
            });
        }
    }

    // 4. Reemplazar el array de adicionales de la reserva
    reservation.adicionales = validatedAdicionales;

    // 5. Recalcular el costo total de la reserva (base del vehículo + nuevos adicionales)
    reservation.totalCost = await recalculateReservationTotalCost(reservation);

    // 6. Guardar la reserva con los adicionales y el costo actualizados
    await reservation.save();

    res.status(200).json({
        message: 'Adicionales de la reserva actualizados y costo recalculado exitosamente.',
        reservation, // Retorna la reserva actualizada
    });
});


module.exports = {
  createReservation,
  getMyReservations,
  getReservationById,
  payReservation,
  cancelReservation,
  updateReservationStatus, // <-- Esta función ahora solo maneja cambios de estado
  getReservationByNumber,
  updateReservationAdicionales, // <-- Exporta la nueva función
};