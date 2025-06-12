// backend/controllers/userController.js

const User = require("../models/User");
const generateToken = require("../utils/generateToken");
// @desc    Crear un nuevo usuario (solo para admin, con asignación de rol)
// @route   POST /api/admin/users
// @access  Admin
const createUserByAdmin = async (req, res) => {
  const { name, lastName, phoneNumber, username, email, password, dni, dateOfBirth, role } = req.body; // <-- RECIBE DNI y dateOfBirth

  if (!name || !lastName || !phoneNumber || !username || !email || !password || !dni || !dateOfBirth) {
    // <-- VALIDA TODOS LOS CAMPOS
    return res
      .status(400)
      .json({
        message:
          "Por favor, introduce usuario, email, contraseña, DNI y fecha de nacimiento.",
      });
  }

  // Validación de mayoría de edad (ej. 18 años)
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  if (age < 18) {
    // Cambia 18 por la edad mínima que desees
    return res
      .status(400)
      .json({ message: "Debes ser mayor de 18 años para registrarte." });
  }

  // El admin puede crear 'user' o 'employee'.
  // si el admin tambien puede crear usuarios admin hay que agregar ese rol
  if (!["user", "employee"].includes(role)) {
    return res
      .status(400)
      .json({
        message: 'Rol inválido. Los roles permitidos son "user" o "employee".',
      });
  }

  try {
    // Validación de unicidad de username, email y DNI
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "El nombre de usuario ya existe." });
    }
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "El email ya está registrado." });
    }
    const dniExists = await User.findOne({ dni }); // <-- CHEQUEA UNICIDAD DEL DNI
    if (dniExists) {
      return res.status(400).json({ message: "El DNI ya está registrado." });
    }

    // El rol 'user' se asigna por defecto
    const user = await User.create({
      name,
      lastName,
      phoneNumber,
      username,
      email,
      password,
      role,
      dni,
      dateOfBirth,
    }); // <-- GUARDA DNI y dateOfBirth

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        username: user.username,
        email: user.email,
        dni: user.dni, // <-- INCLUYE DNI EN LA RESPUESTA
        dateOfBirth: user.dateOfBirth, // <-- INCLUYE FECHA EN LA RESPUESTA
        role: user.role,
        token: generateToken(user._id),
        message: "Registro exitoso.",
      });
    } else {
      res.status(400).json({ message: "Datos de usuario inválidos." });
    }
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    // Manejo específico para errores de unicidad de Mongoose (código 11000)
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.username) {
        return res
          .status(400)
          .json({ message: "El nombre de usuario ya está en uso." });
      }
      if (error.keyPattern && error.keyPattern.email) {
        return res
          .status(400)
          .json({ message: "El email ya está registrado." });
      }
      if (error.keyPattern && error.keyPattern.dni) {
        return res.status(400).json({ message: "El DNI ya está registrado." });
      }
    }
    // Manejo para errores de validación de Mongoose (ej. formato de email, DNI, fecha)
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: `Error del servidor: ${error.message}` });
  }
};

// @desc    Crear un nuevo usuario (solo para employee y admin, con rol 'user' forzado)
// @route   POST /api/employee/users
// @access  Employee, Admin
const createUserByEmployee = async (req, res) => {
  const { username, password } = req.body; // El rol no se toma del body, se fuerza a 'user'

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Por favor, proporciona usuario y contraseña." });
  }

  // Forzar el rol a 'user' para esta ruta
  const role = "user";

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "El usuario ya existe." });
    }

    const user = await User.create({ username, password, role });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role, // Siempre será 'user' aquí
        message: `Usuario ${username} creado con rol ${role} exitosamente.`,
      });
    } else {
      res.status(400).json({ message: "Datos de usuario inválidos." });
    }
  } catch (error) {
    console.error("Error al crear usuario por empleado:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "El nombre de usuario ya está en uso." });
    }
    res.status(500).json({ message: `Error del servidor: ${error.message}` });
  }
};

// @desc    Obtener todos los usuarios (solo para admin)
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password"); // Excluir contraseñas
    res.status(200).json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: `Error del servidor: ${error.message}` });
  }
};

const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password");
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener empleados." });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, dni, dateOfBirth, role, status } =
    req.body;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Si el usuario actualizando es un admin, y intenta cambiar su propio rol a algo que no sea admin,
    // o si un admin intenta cambiar el rol de otro admin, esto puede requerir lógica más compleja.
    // Por simplicidad, aquí permitimos que un admin cambie el rol de otros, pero el admin no puede
    // cambiar su propio rol (si el id del usuario logueado es el mismo que el id en params)
    if (req.user._id.toString() === id && role && role !== user.role) {
      return res
        .status(403)
        .json({ message: "No puedes cambiar tu propio rol." });
    }

    // Actualizar campos si se proporcionan en el body
    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = password; // El middleware pre('save') se encargará de hashearlo
    if (dni) user.dni = dni;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (role) user.role = role;

    // Lógica de actualización de status: solo aplica si el rol del usuario es 'employee'
    if (user.role === "employee") {
      if (status !== undefined && status !== null) {
        user.status = status;
      } else if (user.status === undefined) {
        // Si es un empleado, pero el status no estaba definido (ej. datos antiguos)
        user.status = true; // Por defecto a activo si está indefinido
      }
    } else {
      // Si el rol no es 'employee' (o se cambió de 'employee' a otra cosa),
      // asegura que el campo 'status' sea eliminado del documento en MongoDB.
      user.status = undefined; // Mongoose eliminará el campo si es undefined
    }

    const updatedUser = await user.save(); // Guarda los cambios

    // Excluir información sensible de la respuesta
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpires;

    res.json(userResponse);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    if (error.code === 11000) {
      // Error de duplicado (ej. email o DNI único)
      return res
        .status(400)
        .json({
          message: "El email o DNI ya está registrado para otro usuario.",
        });
    }
    res
      .status(500)
      .json({ message: "Error interno del servidor al actualizar usuario." });
  }
};

module.exports = {
  createUserByAdmin,
  createUserByEmployee, // ¡NUEVO!
  getUsers,
  getEmployees,
  updateUser,
};
