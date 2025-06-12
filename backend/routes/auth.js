const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// ---------------------------------------------------
// Configuración de Nodemailer
// ---------------------------------------------------
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // ej: 'gmail', 'Outlook', 'SendGrid'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Función para generar un código 2FA de 6 dígitos
const generateTwoFactorCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Genera un número de 6 dígitos
};

// Ruta de Registro de Usuario
router.post("/register", async (req, res) => {
    // CAMBIO 1: EXTRAER LOS NUEVOS CAMPOS DEL BODY
    const { name, lastName, phoneNumber, username, email, password, dni, dateOfBirth } = req.body;

    // CAMBIO 2: AÑADIR LOS NUEVOS CAMPOS A LA VALIDACIÓN
    if (!name || !lastName || !phoneNumber || !username || !email || !password || !dni || !dateOfBirth) {
        return res
            .status(400)
            .json({ message: "Por favor, introduce nombre, apellido, teléfono, usuario, email, contraseña, DNI y fecha de nacimiento." });
    }

    // Validación de mayoría de edad (la tienes correctamente, sin cambios aquí)
    const today = new Date();
    const dob = new Date(dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    if (age < 18) {
        return res
            .status(400)
            .json({ message: "Debes ser mayor de 18 años para registrarte." });
    }

    try {
        // Validación de unicidad de username, email y DNI (tienes esto correctamente, sin cambios aquí)
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: "El nombre de usuario ya existe." });
        }
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: "El email ya está registrado." });
        }
        const dniExists = await User.findOne({ dni });
        if (dniExists) {
            return res.status(400).json({ message: "El DNI ya está registrado." });
        }
        // Si phoneNumber es unique en tu esquema, aquí necesitarías agregar:
        // const phoneNumberExists = await User.findOne({ phoneNumber });
        // if (phoneNumberExists) { return res.status(400).json({ message: "El número de teléfono ya está registrado." }); }


        // CAMBIO 3: PASAR LOS NUEVOS CAMPOS AL CREATE
        const user = await User.create({
            name,         // AÑADIDO
            lastName,     // AÑADIDO
            phoneNumber,  // AÑADIDO
            username,
            email,
            password,
            dni,
            dateOfBirth,
            // El rol se asigna por defecto en el modelo si no se especifica aquí
        });

        if (user) {
            // CAMBIO 4: INCLUIR LOS NUEVOS CAMPOS EN LA RESPUESTA
            res.status(201).json({
                _id: user._id,
                name: user.name,         // AÑADIDO
                lastName: user.lastName, // AÑADIDO
                phoneNumber: user.phoneNumber, // AÑADIDO
                username: user.username,
                email: user.email,
                dni: user.dni,
                dateOfBirth: user.dateOfBirth,
                role: user.role,
                token: generateToken(user._id),
                message: "Registro exitoso.",
            });
        } else {
            res.status(400).json({ message: "Datos de usuario inválidos." });
        }
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        // Manejo de errores específicos para unicidad de DNI y otros campos
        if (error.code === 11000) {
            if (error.keyPattern && error.keyPattern.username) {
                return res.status(400).json({ message: "El nombre de usuario ya está en uso." });
            }
            if (error.keyPattern && error.keyPattern.email) {
                return res.status(400).json({ message: "El email ya está registrado." });
            }
            if (error.keyPattern && error.keyPattern.dni) {
                return res.status(400).json({ message: "El DNI ya está registrado." });
            }
            if (error.keyPattern && error.keyPattern.phoneNumber) { // Si hiciste phoneNumber unique
                return res.status(400).json({ message: "El número de teléfono ya está registrado." });
            }
        }
        if (error.name === "ValidationError") {
             const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: `Error del servidor: ${error.message}` });
    }
});

// ---------------------------------------------------
// NUEVA RUTA: Verificación de Doble Factor (2FA)
// ---------------------------------------------------
router.post("/verify-2fa", async (req, res) => {
  const { email, code } = req.body; // Recibe el email del admin y el código ingresado
  if (!email || !code) {
    return res
      .status(400)
      .json({ message: "Email y código son obligatorios." });
  }

  try {
    const user = await User.findOne({ email });

    // 1. Verificar que el usuario exista y sea admin
    if (!user || user.role !== "admin") {
      return res
        .status(401)
        .json({ message: "Acceso no autorizado para este usuario." });
    }

    // 2. Verificar el código y su expiración
    if (user.twoFactorCode !== code || user.twoFactorCodeExpires < Date.now()) {
      // Opcional: Limpiar el código si el intento fue fallido para evitar reintentos con el mismo código expirado
      // user.twoFactorCode = undefined;
      // user.twoFactorCodeExpires = undefined;
      // await user.save();
      return res.status(400).json({
        message:
          "Código de verificación inválido o expirado. Por favor, reintenta.",
      });
    }

    // 3. Si el código es válido, limpiar los campos 2FA del usuario
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpires = undefined;
    await user.save(); // Guarda los cambios en la base de datos

    // 4. Generar el token JWT FINAL para el administrador
    const token = generateToken(user._id);

    // 5. Enviar el token y la información del usuario al frontend
    res.status(200).json({
            message: "Verificación de dos factores exitosa. Inicio de sesión completado.",
            _id: user._id,
            name: user.name,           // AÑADIDO
            lastName: user.lastName,     // AÑADIDO
            phoneNumber: user.phoneNumber, // AÑADIDO
            username: user.username,
            email: user.email,
            dni: user.dni,
            dateOfBirth: user.dateOfBirth,
            role: user.role,
            token: token,
        });
  } catch (error) {
    console.error("Error en /verify-2fa:", error);
    res.status(500).json({
      message: "Error interno del servidor durante la verificación 2FA.",
    });
  }
});

// Ruta de Login de Usuario. Agregue la funcion de verificacion 2FA
router.post("/login", async (req, res) => {
    console.log("!!! Petición recibida en /api/auth/login !!!"); // <-- AÑADE ESTA LÍNEA
    const { email, password } = req.body;

      if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Por favor, introduce email y contraseña." });
    }
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Credenciales inválidas." });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({ message: "Credenciales inválidas." });
        }

        if (user.role === 'employee' && user.status === false) {
            return res.status(403).json({ message: 'Error inesperado... Contacta al administrador' });
        }

        // --- Lógica 2FA para Admin --- (Sin cambios relevantes aquí para los nuevos campos)
        if (user.role === "admin") {
            const twoFactorCode = generateTwoFactorCode();
            const twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000);

            user.twoFactorCode = twoFactorCode;
            user.twoFactorExpires = twoFactorExpires;
            await user.save();

            // Envío del email con el código 2FA
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Código de Verificación para Mobirent (Inicio de Sesión)",
            html: `
                <h1>Código de Verificación para Mobirent</h1>
                <p>Tu código de verificación para iniciar sesión como administrador es: <strong>${twoFactorCode}</strong></p>
                <p>Este código es válido por 10 minutos.</p>
                <p>Si no solicitaste esto, por favor ignora este email.</p>
                <p>Atentamente, <br/>El equipo de Mobirent</p>
            `,
          };

          await transporter.sendMail(mailOptions);

          // Respuesta al frontend indicando que se requiere 2FA
          return res.status(200).json({
            requiresTwoFactor: true,
            message: "Código de verificación enviado a tu email.",
            email: user.email, // Enviar el email es útil para el frontend
          });
        }
        // --- Fin Lógica 2FA ---

        // Si el usuario no es 'admin' o si ya pasó la verificación 2FA,
        // se envía el token JWT y los datos del usuario.
        res.json({
            message: "Inicio de sesión exitoso.",
            _id: user._id,
            name: user.name,           // AÑADIDO
            lastName: user.lastName,     // AÑADIDO
            phoneNumber: user.phoneNumber, // AÑADIDO
            username: user.username,
            email: user.email,
            dni: user.dni,
            dateOfBirth: user.dateOfBirth,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error("Error en /login:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

// ---------------------------------------------------
// Ruta para solicitar el restablecimiento de contraseña
// ---------------------------------------------------
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "El email es requerido." });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Por seguridad, siempre responde con un mensaje genérico
      return res.status(200).json({
        message:
          "Si el email está registrado, se enviará un enlace de restablecimiento de contraseña.",
      });
    }

    // Generar un token único y seguro (usando JWT).
    // NOTA: Usa JWT_SECRET aquí.
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora en milisegundos
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Solicitud de Restablecimiento de Contraseña para MobiRent",
      html: `
                <p>Estimado/a ${user.username || user.email},</p>
                <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta MobiRent.</p>
                <p>Por favor, haga clic en el siguiente enlace para continuar con el proceso:</p>
                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer mi Contraseña</a>
                <p>Este enlace es válido por **1 hora**.</p>
                <p>Si usted no solicitó este restablecimiento, por favor ignore este correo.</p>
                <p>Saludos cordiales,</p>
                <p>El equipo de MobiRent</p>
            `,
    });

    res.status(200).json({
      message:
        "Si el email está registrado, se ha enviado un enlace de restablecimiento de contraseña.",
    });
  } catch (error) {
    console.error("Error en /forgot-password:", error);
    res.status(500).json({
      message:
        "Error interno del servidor al procesar la solicitud de recuperación de contraseña.",
    });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params; // Obtiene el token de los parámetros de la URL
  const { newPassword } = req.body; // Obtiene la nueva contraseña del cuerpo de la petición

  // 1. Validar la nueva contraseña
  if (!newPassword || newPassword.length < 6) {
    // Ejemplo de validación mínima
    return res.status(400).json({
      message: "La nueva contraseña debe tener al menos 6 caracteres.",
    });
  }

  try {
    // 2. Verificar el token JWT
    // Usa JWT_SECRET (o JWT_SECRET_KEY si ese es el nombre de tu variable en .env)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar al usuario por el ID decodificado del token y asegurarse de que el token
    // almacenado en la DB coincide y no ha expirado.
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // $gt significa "greater than" (mayor que)
    });

    if (!user) {
      // Si el token no se encuentra o ha expirado, responde con un error
      return res.status(400).json({
        message: "El token de restablecimiento es inválido o ha expirado.",
      });
    }

    // 3. Asignar y hashear la nueva contraseña
    // El middleware pre('save') en tu modelo de usuario se encargará de hashearla automáticamente
    user.password = newPassword;

    // 4. Limpiar los campos del token para que no pueda ser reutilizado
    user.resetPasswordToken = undefined; // O null
    user.resetPasswordExpires = undefined; // O null
    await user.save(); // Guarda el usuario con la nueva contraseña hasheada y tokens limpios

    res.status(200).json({
      message:
        "Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.",
    });
  } catch (error) {
    // Manejo de errores específicos de JWT (ej. TokenExpiredError, JsonWebTokenError)
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message:
          "Token de restablecimiento inválido. Por favor, solicita uno nuevo.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message:
          "Token de restablecimiento inválido. Por favor, solicita uno nuevo.",
      });
    }
    console.error("Error en /reset-password/:token:", error); // Esto es para ver errores en la consola del backend
    res.status(500).json({
      message: "Error interno del servidor al restablecer la contraseña.",
    });
  }
});

module.exports = router;
