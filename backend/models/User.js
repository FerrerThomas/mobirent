const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      match: [
        /^\d{8,15}$/,
        "El TELEFONO debe contener entre 8 y 15 dígitos numéricos.",
      ],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Por favor, introduce un email válido"],
    },
    password: {
      type: String,
      required: true,
    },
    dni: {
      // <-- NUEVO CAMPO PARA EL DNI
      type: String,
      required: true,
      unique: true, // ¡Importante! Asegura que el DNI sea único
      trim: true,
      match: [
        /^\d{7,9}$/,
        "El DNI debe contener entre 7 y 9 dígitos numéricos.",
      ], // Validación básica de formato DNI
    },
    dateOfBirth: {
      // <-- NUEVO CAMPO PARA FECHA DE NACIMIENTO
      type: Date, // Tipo Date para almacenar fechas
      required: true,
    },
    // --- Campos para la recuperación de contraseña ---
    resetPasswordToken: {
      type: String,
      default: null, // Por defecto no habrá token
    },
    resetPasswordExpires: {
      type: Date,
      default: null, // Por defecto no habrá fecha de expiración
    },
    // --- Fin de campos para recuperación de contraseña ---
    role: {
      type: String,
      enum: ["user", "employee", "admin"],
      default: "user",
    },
    status: {
    type: Boolean,
    required: function() { return this.role === 'employee'; }, // Solo requerido si el rol es 'employee'
    default: function() { return this.role === 'employee' ? true : undefined; } // Por defecto true para empleados, undefined para otros
    },
    // --- NUEVOS CAMPOS PARA 2FA ---
    twoFactorCode: {
      type: String,
      default: null,
    },
    twoFactorExpires: {
      type: Date,
      default: null,
    },
    // --- FIN NUEVOS CAMPOS ---
  },
  {
    timestamps: true,
  }
);

// Middleware para encriptar la contraseña antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") && !this.isNew) {
    // 01-06 !this.isNew para no hashear si es un documento nuevo sin password modificado
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;