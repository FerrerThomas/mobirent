import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

// Definimos la URL base de la API usando la variable de entorno de Vite
const API_BASE_URL = import.meta.env.VITE_API_URL; // <--- LÍNEA AÑADIDA

const PageContainer = styled.div`
  background-color: #f0f2f5;
  min-height: 100vh;
  padding: 80px 20px 40px;
  box-sizing: border-box;
  color: #333;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: center; /* Centra el contenido si no hay sidebar */

  @media (max-width: 768px) {
    flex-direction: column;
    padding-top: 20px;
    align-items: center;
  }
`;

const MainContent = styled.div`
  flex-grow: 1;
  max-width: 900px; /* Limita el ancho del contenido principal para que no se extienda demasiado */
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  text-align: center; /* Centra el texto del título */

  @media (max-width: 768px) {
    padding: 15px;
    margin-top: 20px;
    width: 100%;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.8em;
  color: #007bff;
  margin-bottom: 10px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 2em;
  }
`;

const PageSubText = styled.p`
  font-size: 1.1em;
  color: #555;
  margin-bottom: 20px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 0.9em;
  }
`;

const StyledForm = styled.form`
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 30px;
  margin-bottom: 40px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: left; /* Alinea los labels y inputs a la izquierda dentro del formulario */

  h2 {
    color: #007bff;
    margin-bottom: 25px;
    font-size: 2em;
    text-align: center;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #555;
  }

  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="date"],
  select {
    width: 100%;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1em;
    box-sizing: border-box; /* Incluye padding y border en el width */
    transition: border-color 0.3s ease, box-shadow 0.3s ease;

    &:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
      outline: none;
    }
  }
`;

const SubmitButton = styled.button`
  background-color: #28a745;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: bold;
  width: 100%;
  margin-top: 20px;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #218838;
    transform: translateY(-2px);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const Message = styled.p`
  margin-top: 20px;
  padding: 10px 15px;
  border-radius: 5px;
  font-weight: bold;
  text-align: center;

  &.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  &.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
`;

const UserListContainer = styled.div`
  margin-top: 40px;
  text-align: center; /* Centra el título de la lista */

  h2 {
    color: #007bff;
    margin-bottom: 25px;
    font-size: 2em;
  }
`;

const UserGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(280px, 1fr)
  ); /* Columnas responsivas */
  gap: 20px;
  margin-bottom: 30px;
  padding: 0; /* Asegúrate de que no haya padding que cause desborde */
  list-style: none; /* Elimina los puntos de la lista */
`;

const UserCard = styled.div`
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-align: left; /* Alinea el contenido de la tarjeta a la izquierda */

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  h3 {
    font-size: 1.5em;
    color: #333;
    margin-bottom: 10px;
    word-break: break-word; /* Rompe palabras largas */
  }

  p {
    font-size: 0.95em;
    color: #666;
    margin-bottom: 5px;

    strong {
      color: #333;
    }
  }

  .role-tag {
    display: inline-block;
    background-color: #007bff;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 0.8em;
    font-weight: bold;
    margin-top: 10px;
  }

  /* Colores específicos para roles */
  &.role-admin .role-tag {
    background-color: #dc3545;
  } /* Rojo */
  &.role-employee .role-tag {
    background-color: #ffc107;
    color: #333;
  } /* Amarillo/Naranja (texto oscuro) */
  &.role-user .role-tag {
    background-color: #17a2b8;
  } /* Azul cian */
`;

const BackButton = styled.button`
  background-color: #6c757d;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 30px;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #5a6268;
    transform: translateY(-2px);
  }
`;

function AdminUserManagementPage() {
  const [name, setName] = useState(""); // <--- NUEVO
  const [lastName, setLastName] = useState(""); // <--- NUEVO
  const [phoneNumber, setPhoneNumber] = useState(""); // <--- NUEVO
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("employee"); // Por defecto para crear empleados
  const [dni, setDni] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [users, setUsers] = useState([]); // Para listar usuarios
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // MODIFICACIÓN: Usamos la variable de entorno para la URL
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data); // Mantiene la lógica original: setea todos los usuarios recibidos
      } else {
        setMessage(data.message || "Error al cargar usuarios.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      setMessage("Ocurrió un error de red o de servidor al cargar usuarios.");
      setMessageType("error");
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (
      !name ||
      !lastName ||
      !phoneNumber ||
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !dni ||
      !dateOfBirth
    ) {
      // <--- NUEVO
      setMessage("Todos los campos son obligatorios.");
      setMessageType("error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("No autorizado. Por favor, inicia sesión de nuevo.");
      setMessageType("error");
      navigate("/login");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      setMessageType("error");
      return;
    }

    const today = new Date();
    const dob = new Date(dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 18) {
      setMessage("Debes ser mayor de 18 años para registrarte.");
      setMessageType("error");
      return;
    }

    try {
      // MODIFICACIÓN: Usamos la variable de entorno para la URL
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          lastName,
          phoneNumber,
          username,
          email,
          password,
          dni,
          dateOfBirth,
          role,
        }), // NUEVO
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Usuario creado exitosamente.");
        setMessageType("success");
        // Limpiar campos del formulario
        setName(""); // <--- NUEVO
        setLastName(""); // <--- NUEVO
        setPhoneNumber(""); // <--- NUEVO
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setDni("");
        setDateOfBirth("");
        setRole("employee"); // Resetear al rol por defecto
        fetchUsers(); // Volver a cargar la lista de usuarios
      } else {
        setMessage(data.message || "Error al crear usuario.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error al crear usuario:", error);
      setMessage("Ocurrió un error de red o de servidor.");
      setMessageType("error");
    }
  };

  const handleGoBack = () => {
    navigate("/panel-de-control");
  };

  return (
    <PageContainer>
      <MainContent>
        <PageTitle>Gestión de Usuarios</PageTitle>
        <PageSubText>
          Aquí puedes crear nuevos usuarios y gestionar los existentes.
        </PageSubText>

        <StyledForm onSubmit={handleSubmit}>
          <h2>Crear Nuevo Usuario</h2>
          {/* CAMPOS DEL FORMULARIO: AÑADIR INPUTS PARA LOS NUEVOS CAMPOS */}
          <FormGroup>
            <label htmlFor="adminName">Nombre:</label>
            <input
              type="text"
              id="adminName"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <label htmlFor="adminLastName">Apellido:</label>
            <input
              type="text"
              id="adminLastName"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <label htmlFor="adminPhoneNumber">Teléfono:</label>
            <input
              type="text" // Usar text para permitir el pattern, pero validar con regex
              id="adminPhoneNumber"
              name="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              pattern="^\d{8,15}$" // Validación HTML5 para formato
              title="El TELÉFONO debe contener entre 8 y 15 dígitos numéricos."
            />
          </FormGroup>
          <FormGroup>
            <label htmlFor="adminUsername">Usuario:</label>
            <input
              type="text"
              id="adminUsername"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <label htmlFor="adminEmail">Email:</label>
            <input
              type="email"
              id="adminEmail"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <label htmlFor="adminDni">DNI:</label>
            <input
              type="text"
              id="adminDni"
              name="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
              pattern="\d{7,9}"
              title="El DNI debe contener entre 7 y 9 dígitos numéricos."
            />
          </FormGroup>
          <FormGroup>
            <label htmlFor="adminDateOfBirth">Fecha de Nacimiento:</label>
            <input
              type="date"
              id="adminDateOfBirth"
              name="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              max={new Date().toISOString().split("T")[0]}
            />
          </FormGroup>
          <FormGroup>
            <label htmlFor="adminPassword">Contraseña:</label>
            <input
              type="password"
              id="adminPassword"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <label htmlFor="adminConfirmPassword">Confirmar Contraseña:</label>
            <input
              type="password"
              id="adminConfirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <label htmlFor="adminRole">Rol:</label>
            <select
              id="adminRole"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="employee">Empleado</option>
              <option value="user">Usuario Normal</option>
              {/*<option value="admin">Administrador</option>  solo por si necesitabamos crear admin, sino se borra esta linea listo */}
            </select>
          </FormGroup>
          <SubmitButton type="submit">Crear Usuario</SubmitButton>
          {message && <Message className={messageType}>{message}</Message>}
        </StyledForm>

        <BackButton onClick={handleGoBack}>
          Volver a Panel de Control
        </BackButton>

        <UserListContainer>
          <h2>Usuarios Existentes</h2>
          {users.length > 0 ? (
            <UserGrid>
              {users.map((user) => (
                <UserCard key={user._id} className={`role-${user.role}`}>
                  <h3>{user.username}</h3>
                  {/* Mostrar los nuevos campos en la lista */}
                  <p>
                    Nombre:{" "}
                    <strong>
                      {user.name} {user.lastName}
                    </strong>
                  </p>{" "}
                  {/* <--- MODIFICADO */}
                  <p>
                    Teléfono: <strong>{user.phoneNumber}</strong>
                  </p>{" "}
                  {/* <--- NUEVO */}
                  <p>
                    Email: <strong>{user.email}</strong>
                  </p>
                  <p>
                    DNI: <strong>{user.dni}</strong>
                  </p>
                  <p>
                    Nacimiento:{" "}
                    <strong>
                      {new Date(user.dateOfBirth).toLocaleDateString()}
                    </strong>
                  </p>
                  <span className="role-tag">
                    Rol:{" "}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </UserCard>
              ))}
            </UserGrid>
          ) : (
            <PageSubText>No hay usuarios registrados.</PageSubText>
          )}
        </UserListContainer>
      </MainContent>
    </PageContainer>
  );
}

export default AdminUserManagementPage;
