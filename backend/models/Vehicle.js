// backend/models/Vehicle.js
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const vehicleSchema = new mongoose.Schema(
  {
    // Propiedades existentes
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    pricePerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    isAvailable: {
      // Mantener esto
      type: Boolean,
      default: true,
    },
    photoUrl: {
      type: String,
      required: false, // Ahora es opcional
      trim: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // NUEVAS PROPIEDADES
    type: {
      // "tipo" de vehículo (ej: "sedan", "SUV", "compacto")
      type: String,
      required: true,
      trim: true,
      enum: [
        "sedan",
        "SUV",
        "compacto",
        "camioneta",
        "deportivo",
        "furgoneta",
        "otro",
      ], // Opciones de tipo de vehículo
    },
    licensePlate: {
      // "patente"
      type: String,
      required: true,
      unique: true, // La patente debe ser única
      trim: true,
      uppercase: true, // Guardar en mayúsculas
    },
    needsMaintenance: {
      // "mantenimiento" (true o false)
      type: Boolean,
      default: false, // Por defecto no necesita mantenimiento
    },
    capacity: {
      // "capacidad" (número del 1 al 10)
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    transmission: {
      // "caja" (automática o manual)
      type: String,
      required: true,
      enum: ["automatic", "manual"], // Opciones de caja
    },
    branch: {
      // ¡CAMBIO AQUÍ! Ahora es una referencia a la Sucursal
      type: mongoose.Schema.Types.ObjectId, // Tipo ObjectId
      ref: "Branch", // Referencia al modelo 'Branch'
      required: true, // Una sucursal es obligatoria para un vehículo
    },
    maintenanceReason: {
      // Motivo del mantenimiento
      type: String,
      required: function () {
        return this.needsMaintenance === true;
      }, // Requerido solo si está en mantenimiento
      default: null, // O un string vacío, como prefieras
    },
    maintenanceStartDate: {
      // Fecha de inicio del mantenimiento
      type: Date,
      required: function () {
        return this.needsMaintenance === true;
      }, // Requerido solo si está en mantenimiento
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Aplica el plugin AutoIncrement al esquema
vehicleSchema.plugin(AutoIncrement, {
  inc_field: "vehicleId",
  start_seq: 1000,
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
