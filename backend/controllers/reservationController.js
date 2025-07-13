const asyncHandler = require("express-async-handler");
const Reservation = require("../models/Reservation");
const Vehicle = require("../models/Vehicle");
const Branch = require("../models/Branch");
const Adicional = require("../models/Adicional");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const fakePaymentService = require("../services/fakePaymentService");
const { calculateRefund } = require("../services/refundService");

// Helper para calcular el costo total (mantener si se usa en createReservation)
const calculateTotalCost = (startDate, endDate, vehiclePricePerDay) => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * vehiclePricePerDay;
};

// Helper para recalcular el costo total de la reserva incluyendo adicionales
// NOTA: Esta función ya no se usará para actualizar el totalCost en pickupReservation,
// pero se mantiene por si se usa en otras partes del código (ej. updateReservationAdicionales).
const recalculateReservationTotalCost = async (reservation) => {
  // Si la reserva no tiene vehicle o no tiene pricePerDay, manejar el error o devolver el costo actual
  if (!reservation.vehicle || !reservation.vehicle.pricePerDay) {
    console.warn(
      "Advertencia: Vehículo o pricePerDay no disponibles para recalcular el costo base."
    );
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
  if (!vehicle.isAvailable) {
    res.status(400);
    throw new Error("Vehículo no disponible.");
  }

  // 4) Revisar reservas superpuestas
  const overlappingReservations = await Reservation.find({
    vehicle: vehicleId,
    status: { $in: ["pending", "confirmed", "picked_up"] },
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
    reservationNumber: null,
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
    .populate(
      "vehicle",
      "brand model licensePlate pricePerDay photoUrl needsMaintenance isAvailable"
    )
    .populate("pickupBranch", "name address")
    .populate("returnBranch", "name address")
    .populate("adicionales.adicional", "name price description");

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
    reservation.status = "cancelled";
    reservation.paymentInfo.status = "rejected";
    await reservation.save();
    res.status(400);
    throw new Error(
      "Se venció el plazo de pago (30 min). La reserva ha sido cancelada."
    );
  }

  // 5) Procesar el pago simulado
  const monto = reservation.totalCost;
  const resultado = await fakePaymentService.processPayment(paymentData, monto);

  if (resultado.status === "rejected") {
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
  reservation.voucherSent = true;
  await reservation.save();

  // 7) Marcar vehículo como no disponible
  const vehiculo = await Vehicle.findById(reservation.vehicle._id);
  if (vehiculo) {
    vehiculo.isAvailable = false; // Un vehículo reservado no está disponible para otros
    await vehiculo.save();
    console.log("[PAY] Después de save(), estado en BD:", reservation.status);
  }

  // 8) Enviar voucher por correo
  try {
    const userEmail = reservation.user.email;
    const userName =
      reservation.user.username || reservation.user.email.split("@")[0];
    const vehicleDetails = reservation.vehicle
      ? `${reservation.vehicle.brand} ${reservation.vehicle.model} (${reservation.vehicle.licensePlate})`
      : "N/A";
    const pickupBranchName = reservation.pickupBranch
      ? `${reservation.pickupBranch.name} (${reservation.pickupBranch.address})`
      : "N/A";
    const returnBranchName = reservation.returnBranch
      ? `${reservation.returnBranch.name} (${reservation.returnBranch.address})`
      : "N/A";

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
    .populate("vehicle")
    .populate("user", "username email");

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
  reservation.canceledAt = new Date();
  reservation.refundAmount = refundAmount;
  await reservation.save();

  // 6) Liberar disponibilidad del vehículo
  const vehicle = await Vehicle.findById(reservation.vehicle._id);
  if (vehicle) {
    if (!vehicle.needsMaintenance) {
      vehicle.isAvailable = true; // Vuelve a estar disponible si no necesita mantenimiento
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
      reservation.user.email,
      `Confirmación de Cancelación - Reserva #${reservation.reservationNumber}`,
      correoHtml
    );
    console.log(
      `Email de cancelación con reembolso enviado a ${reservation.user.email} para reserva ${reservation.reservationNumber}`
    );
  } catch (mailErr) {
    console.error("Error al enviar email de cancelación:", mailErr);
  }

  res.status(200).json({
    message: "Reserva cancelada con éxito.",
    refundAmount: refundAmount,
    refundType: refundType,
    reservationId: reservation._id,
    status: "cancelled",
  });
});

//-------- tomi 28/06
const getReservationByNumber = asyncHandler(async (req, res) => {
  const reservationNumber = req.params.reservationNumber;
  const reservation = await Reservation.findOne({ reservationNumber })
    .populate("user", "username email")
    .populate(
      "vehicle",
      "brand model licensePlate pricePerDay photoUrl needsMaintenance isAvailable"
    )
    .populate("pickupBranch", "name address")
    .populate("returnBranch", "name address")
    .populate("adicionales.adicional", "name price description");

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
  const { status } = req.body;
  const userId = req.user._id;

  const reservation = await Reservation.findById(reservationId).populate(
    "vehicle"
  );

  if (!reservation) {
    res.status(404);
    throw new Error("Reserva no encontrada.");
  }

  const allowedTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["picked_up", "cancelled"],
    picked_up: ["returned"],
    returned: ["completed"],
  };

  if (
    !allowedTransitions[reservation.status] ||
    !allowedTransitions[reservation.status].includes(status)
  ) {
    res.status(400);
    throw new Error(
      `Transición de estado inválida de '${reservation.status}' a '${status}'.`
    );
  }

  reservation.status = status;

  const vehicle = await Vehicle.findById(reservation.vehicle._id);
  if (!vehicle) {
    res.status(404);
    throw new Error("Vehículo asociado a la reserva no encontrado.");
  }

  // Lógica específica para el vehículo según el nuevo estado
  if (status === "returned") {
    const { maintenanceReason } = req.body;
    if (!maintenanceReason || maintenanceReason.trim() === "") {
      res.status(400);
      throw new Error(
        "El motivo de mantenimiento es obligatorio al marcar la reserva como devuelta."
      );
    }
    vehicle.needsMaintenance = true;
    vehicle.maintenanceReason = maintenanceReason;
    vehicle.maintenanceStartDate = new Date();
    vehicle.isAvailable = false; // No está disponible si necesita mantenimiento
  }

  // Si el estado es 'cancelled', liberar vehículo (si estaba no disponible por esta reserva)
  if (status === "cancelled") {
    if (!vehicle.needsMaintenance) {
      // Solo si no necesita mantenimiento por otra razón
      vehicle.isAvailable = true;
    }
  }

  await reservation.save();
  await vehicle.save();

  res.status(200).json({
    message: `Estado de la reserva actualizado a '${reservation.status}'.`,
    reservation,
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
  const reservation = await Reservation.findById(reservationId).populate(
    "vehicle"
  );

  if (!reservation) {
    res.status(404);
    throw new Error("Reserva no encontrada.");
  }

  // 2. Validar que la reserva esté en un estado donde se puedan modificar adicionales
  const allowedStatuses = ["pending", "confirmed", "picked_up"];
  if (!allowedStatuses.includes(reservation.status)) {
    res.status(400);
    throw new Error(
      `No se pueden modificar adicionales en el estado actual de la reserva: ${reservation.status}.`
    );
  }

  // 3. Procesar y validar los nuevos datos de adicionales
  let validatedAdicionales = [];
  if (newAdicionalesData && newAdicionalesData.length > 0) {
    for (const item of newAdicionalesData) {
      if (
        !item.adicionalId ||
        item.quantity === undefined ||
        item.quantity < 0
      ) {
        res.status(400);
        throw new Error(
          "Datos de adicional inválidos: ID o cantidad faltante/inválida. La cantidad no puede ser negativa."
        );
      }
      if (item.quantity === 0) {
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
  // ESTA ES LA ÚNICA FUNCIÓN DONDE EL COSTO TOTAL SE RECALCULA EN EL BACKEND
  // PARA REFLEJAR CAMBIOS EN LOS ADICIONALES.
  reservation.totalCost = await recalculateReservationTotalCost(reservation);

  // 6. Guardar la reserva con los adicionales y el costo actualizados
  await reservation.save();

  res.status(200).json({
    message:
      "Adicionales de la reserva actualizados y costo recalculado exitosamente.",
    reservation,
  });
});

// @desc    Obtener estadísticas de facturación detalladas
// @route   GET /api/reservations/total-revenue
// @access  Private/Employee/Admin
const getTotalRevenue = async (req, res) => {
  try {
    const revenueStats = await Reservation.aggregate([
      {
        $match: {
          status: { $in: ["confirmed", "picked_up", "returned", "cancelled"] },
        },
      },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$totalCost" },
          refundedAmountSum: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "cancelled"] },
                then: "$refundAmount",
                else: 0,
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          totalAmount: 1,
          refundedAmountSum: 1,
        },
      },
    ]);

    let confirmedRevenue = 0;
    let pickedUpRevenue = 0;
    let returnedRevenue = 0;
    let cancelledAmount = 0;
    let cancelledRefundAmount = 0;

    revenueStats.forEach((stat) => {
      if (stat.status === "confirmed") {
        confirmedRevenue = stat.totalAmount || 0;
      } else if (stat.status === "picked_up") {
        pickedUpRevenue = stat.totalAmount || 0;
      } else if (stat.status === "returned") {
        returnedRevenue = stat.totalAmount || 0;
      } else if (stat.status === "cancelled") {
        cancelledAmount = stat.totalAmount || 0;
        cancelledRefundAmount = stat.refundedAmountSum || 0;
      }
    });

    const totalRevenue = confirmedRevenue + pickedUpRevenue + returnedRevenue;

    res.status(200).json({
      success: true,
      totalRevenue,
      confirmedRevenue,
      pickedUpRevenue,
      returnedRevenue,
      cancelledAmount,
      cancelledRefundAmount,
    });
  } catch (error) {
    console.error("Error al obtener la facturación total:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la facturación total.",
    });
  }
};

// @desc    Obtener todas las reservas para reportes
// @route   GET /api/reservations/report
// @access  Private/Employee/Admin
const getAllReservationsForReport = async (req, res) => {
  try {
    const reservations = await Reservation.find({})
      .select("reservationNumber startDate totalCost status refundAmount")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    console.error("Error al obtener las reservas para el reporte:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las reservas para el reporte.",
    });
  }
};

/**
 * @desc    Marcar una reserva como "retirada" (picked_up) y gestionar la disponibilidad del vehículo.
 * Implementa la lógica de reemplazo de vehículos si el original no está disponible.
 * @route   PUT /api/reservations/:id/pickup
 * @access  Private (Admin, Employee)
 *
 * @param {string} req.params.id - ID de la reserva.
 * @param {string} [req.body.replacementVehicleId] - Opcional. ID del vehículo de reemplazo seleccionado por el empleado.
 */
const pickupReservation = asyncHandler(async (req, res) => {
  const reservationId = req.params.id;
  const { replacementVehicleId } = req.body;

  console.log(
    `[BACKEND DEBUG] pickupReservation llamado para Reserva ID: ${reservationId}`
  );
  console.log(
    `[BACKEND DEBUG] replacementVehicleId recibido: ${replacementVehicleId}`
  );

  // 1. Buscar la reserva y poblar los detalles necesarios
  const reservation = await Reservation.findById(reservationId)
    .populate("vehicle")
    .populate("pickupBranch")
    .populate("user", "username email");

  if (!reservation) {
    console.log(`[BACKEND DEBUG] Reserva ${reservationId} no encontrada.`);
    res.status(404);
    throw new Error("Reserva no encontrada.");
  }
  console.log(
    `[BACKEND DEBUG] Estado actual de la reserva: ${reservation.status}`
  );

  // Regla 1: la reserva debe estar en estado “confirmed”
  if (reservation.status !== "confirmed") {
    console.log(
      `[BACKEND DEBUG] La reserva no está en estado 'confirmed'. Estado: ${reservation.status}`
    );
    res.status(400);
    throw new Error(
      `La reserva debe estar en estado 'confirmed' para ser retirada. Estado actual: ${reservation.status}.`
    );
  }

  let originalVehicle = reservation.vehicle;
  console.log(
    `[BACKEND DEBUG] Vehículo original de la reserva: ${originalVehicle.brand} ${originalVehicle.model} (${originalVehicle.licensePlate})`
  );
  console.log(
    `[BACKEND DEBUG] Estado del vehículo original: isAvailable=${originalVehicle.isAvailable}, needsMaintenance=${originalVehicle.needsMaintenance}`
  );

  // Verificar si el vehículo original está disponible para la entrega.
  // Se considera no disponible si needsMaintenance es true o isAvailable es false.
  const isOriginalVehicleTrulyAvailableForPickup =
    originalVehicle &&
    !originalVehicle.needsMaintenance &&
    originalVehicle.isAvailable;

  console.log(
    `[BACKEND DEBUG] isOriginalVehicleTrulyAvailableForPickup: ${isOriginalVehicleTrulyAvailableForPickup}`
  );

  // Si el vehículo original NO está disponible, buscar alternativas
  if (!isOriginalVehicleTrulyAvailableForPickup) {
    console.log(
      `[BACKEND DEBUG] Vehículo original NO disponible para entrega directa. Buscando reemplazos.`
    );

    // Obtener IDs de vehículos ocupados por otras reservas en el rango de tiempo de esta reserva
    // Excluir vehículos que ya están en otras reservas activas (confirmed, picked_up)
    const allOverlappingReservations = await Reservation.find({
      _id: { $ne: reservation._id }, // Excluir la reserva actual
      status: { $in: ["confirmed", "picked_up"] }, // Considerar solo reservas activas
      $or: [
        // Verificar si las fechas se superponen
        {
          startDate: { $lt: reservation.endDate, $gte: reservation.startDate },
        },
        { endDate: { $gt: reservation.startDate, $lte: reservation.endDate } },
        {
          startDate: { $lte: reservation.startDate },
          endDate: { $gte: reservation.endDate },
        },
      ],
    }).select("vehicle");
    const allReservedVehicleIds = allOverlappingReservations.map((res) =>
      res.vehicle.toString()
    );

    // Buscar vehículos disponibles en la misma sucursal de retiro
    const availableVehiclesInBranch = await Vehicle.find({
      _id: { $nin: allReservedVehicleIds }, // Excluir vehículos ya reservados por otras reservas
      branch: reservation.pickupBranch._id,
      isAvailable: true, // Debe estar disponible para ser un reemplazo
      needsMaintenance: false, // No debe necesitar mantenimiento
    }).sort({ pricePerDay: -1 }); // Ordenar por precio de mayor a menor para sugerir primero los más caros

    console.log(
      `[BACKEND DEBUG] Vehículos disponibles en la sucursal para reemplazo (antes de filtrar por precio): ${availableVehiclesInBranch.length}`
    );

    // Filtrar por precio
    const higherOrEqualPriceVehicles = availableVehiclesInBranch.filter(
      (v) => v.pricePerDay >= originalVehicle.pricePerDay
    );
    const lowerPriceVehicles = availableVehiclesInBranch.filter(
      (v) => v.pricePerDay < originalVehicle.pricePerDay
    );

    console.log(
      `[BACKEND DEBUG] Vehículos de mayor o igual precio: ${higherOrEqualPriceVehicles.length}`
    );
    console.log(
      `[BACKEND DEBUG] Vehículos de menor precio: ${lowerPriceVehicles.length}`
    );

    // Si no hay vehículos disponibles en la sucursal que puedan ser reemplazo
    if (availableVehiclesInBranch.length === 0) {
      console.log(
        `[BACKEND DEBUG] No hay vehículos de reemplazo disponibles en la sucursal.`
      );
      res.status(200).json({
        message:
          "El vehículo original no está disponible y no hay reemplazos en esta sucursal. Por favor, contacta a un administrador.",
        originalVehicleUnavailable: true,
        availableReplacements: {
          higherOrEqualPrice: [],
          lowerPrice: [],
        },
      });
      return;
    }

    // Si se envió un replacementVehicleId desde el frontend (empleado ya seleccionó uno)
    if (replacementVehicleId) {
      console.log(
        `[BACKEND DEBUG] Se recibió un replacementVehicleId: ${replacementVehicleId}`
      );
      const selectedReplacementVehicle = availableVehiclesInBranch.find(
        (v) => v._id.toString() === replacementVehicleId
      );

      if (!selectedReplacementVehicle) {
        console.log(
          `[BACKEND DEBUG] Vehículo de reemplazo seleccionado ${replacementVehicleId} no es válido o no está disponible.`
        );
        res.status(400).json({
          message:
            "El vehículo de reemplazo seleccionado no es válido o no está disponible.",
          originalVehicleUnavailable: true, // Mantener esta bandera para que el frontend sepa que debe mostrar el modal
          availableReplacements: {
            // Devolver las opciones de nuevo
            higherOrEqualPrice: higherOrEqualPriceVehicles.map((v) => ({
              _id: v._id,
              brand: v.brand,
              model: v.model,
              licensePlate: v.licensePlate,
              pricePerDay: v.pricePerDay,
              photoUrl: v.photoUrl,
              type: v.type,
              capacity: v.capacity,
              transmission: v.transmission,
            })),
            lowerPrice: lowerPriceVehicles.map((v) => ({
              _id: v._id,
              brand: v.brand,
              model: v.model,
              licensePlate: v.licensePlate,
              pricePerDay: v.pricePerDay,
              photoUrl: v.photoUrl,
              type: v.type,
              capacity: v.capacity,
              transmission: v.transmission,
            })),
          },
        });
        return;
      }
      console.log(
        `[BACKEND DEBUG] Vehículo de reemplazo seleccionado: ${selectedReplacementVehicle.brand} ${selectedReplacementVehicle.model}`
      );

      // Liberar el vehículo original (marcarlo como disponible si no está en mantenimiento)
      if (originalVehicle) {
        console.log(
          `[BACKEND DEBUG] Liberando vehículo original: ${originalVehicle.licensePlate}`
        );
        if (!originalVehicle.needsMaintenance) {
          originalVehicle.isAvailable = true;
        }
        await originalVehicle.save();
      }

      // Asignar el nuevo vehículo a la reserva
      reservation.vehicle = selectedReplacementVehicle._id;
      reservation.pickedUpAt = new Date();

      // *** CAMBIO SOLICITADO: NO RECALCULAR EL COSTO TOTAL DE LA RESERVA ***
      // La línea `reservation.totalCost = newTotalCost;` ha sido eliminada.
      // La diferencia de precio ya no se calcula ni se aplica al totalCost de la reserva.

      // Marcar el vehículo de reemplazo como no disponible
      selectedReplacementVehicle.isAvailable = false;
      await selectedReplacementVehicle.save();
      console.log(
        `[BACKEND DEBUG] Vehículo de reemplazo marcado como no disponible.`
      );

      // Actualizar el estado de la reserva
      reservation.status = "picked_up";
      await reservation.save();
      console.log(
        `[BACKEND DEBUG] Estado de la reserva cambiado a 'picked_up'.`
      );

      res.status(200).json({
        message: `Vehículo original no disponible. Reserva actualizada con ${selectedReplacementVehicle.brand} ${selectedReplacementVehicle.model} (${selectedReplacementVehicle.licensePlate}) y marcada como retirada. El costo total de la reserva se mantiene sin cambios.`,
        reservation,
        replacementDetails: {
          originalVehicle: {
            brand: originalVehicle.brand,
            model: originalVehicle.model,
            licensePlate: originalVehicle.licensePlate,
          },
          newVehicle: {
            brand: selectedReplacementVehicle.brand,
            model: selectedReplacementVehicle.model,
            licensePlate: selectedReplacementVehicle.licensePlate,
            pricePerDay: selectedReplacementVehicle.pricePerDay, // Se mantiene para información, no para cálculo
          },
          priceDifference: 0, // Siempre 0 ya que no se ajusta el costo
        },
      });
      return;
    } else {
      // Si el original no está disponible y NO se ha seleccionado un reemplazo,
      // se devuelve la lista de opciones al frontend para que el empleado elija.
      console.log(
        `[BACKEND DEBUG] Devolviendo opciones de reemplazo al frontend (para selección).`
      );
      res.status(200).json({
        message:
          "El vehículo original no está disponible. Por favor, selecciona un vehículo de reemplazo.",
        originalVehicleUnavailable: true,
        availableReplacements: {
          higherOrEqualPrice: higherOrEqualPriceVehicles.map((v) => ({
            _id: v._id,
            brand: v.brand,
            model: v.model,
            licensePlate: v.licensePlate,
            pricePerDay: v.pricePerDay,
            photoUrl: v.photoUrl,
            type: v.type,
            capacity: v.capacity,
            transmission: v.transmission,
          })),
          lowerPrice: lowerPriceVehicles.map((v) => ({
            _id: v._id,
            brand: v.brand,
            model: v.model,
            licensePlate: v.licensePlate,
            pricePerDay: v.pricePerDay,
            photoUrl: v.photoUrl,
            type: v.type,
            capacity: v.capacity,
            transmission: v.transmission,
          })),
        },
      });
      return;
    }
  }

  // Escenario 1: Vehículo original disponible y no se necesita reemplazo
  console.log(
    `[BACKEND DEBUG] Vehículo original disponible. Procediendo con la entrega.`
  );
  // Marcar el vehículo original como no disponible
  if (originalVehicle) {
    originalVehicle.isAvailable = false;
    await originalVehicle.save();
    console.log(
      `[BACKEND DEBUG] Vehículo original marcado como no disponible.`
    );
  }

  // Actualizar el estado de la reserva
  reservation.status = "picked_up";
  reservation.pickedUpAt = new Date();
  await reservation.save();
  console.log(`[BACKEND DEBUG] Estado de la reserva cambiado a 'picked_up'.`);

  res.status(200).json({
    message: `Reserva ${reservation.reservationNumber} marcada como retirada. Vehículo ${originalVehicle.brand} ${originalVehicle.model} (${originalVehicle.licensePlate}) entregado.`,
    reservation,
  });
});

module.exports = {
  createReservation,
  getMyReservations,
  getReservationById,
  payReservation,
  cancelReservation,
  getReservationByNumber,
  updateReservationStatus,
  updateReservationAdicionales,
  getTotalRevenue,
  getAllReservationsForReport,
  pickupReservation,
};
