import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Importa useNavigate para la redirección programática
import styled from "styled-components"; // Importa styled-components

// Definimos la URL base de la API usando la variable de entorno de Vite
const API_BASE_URL = import.meta.env.VITE_API_URL; // <--- Ya estaba, ¡bien!

const RegisterPageContainer = styled.div`
  // Fondo sin imagen, usando un gradiente similar al de Login
  width: 100vw;
  height: 100vh;
  background: linear-gradient(
    to right,
rgb(86, 97, 255) 0%,
rgb(0, 64, 175) 100%
  ); /* Gradiente azul/morado */
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding-top: 60px; /* Ajusta este padding para dejar espacio al Navbar fijo */
  box-sizing: border-box; /* Incluye padding en el total height */
`;

const RegisterFormWrapper = styled.div`
  background-color: rgba(
    255,
    255,
    255,
    0.95
  ); /* Fondo casi blanco con ligera transparencia */
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4); /* Sombra pronunciada */
  text-align: center;
  width: 100%;
  max-width: 450px; /* Un poco más ancho para los campos adicionales */
  z-index: 1;
  overflow-y: auto; /* Permite scroll si el contenido es demasiado largo en pantallas pequeñas */
  max-height: calc(
    90vh - 120px
  ); /* Ajusta para que el formulario no exceda la altura de la pantalla */
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 30px;
  font-size: 2.5em;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 3px; /* Espacio entre los grupos de formulario */
`;

const FormGroup = styled.div`
  text-align: left;
  margin-bottom: 5px; /* Menor margen para formularios más largos */
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: bold;
  font-size: 1.1em;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1em;
  box-sizing: border-box;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const SubmitButton = styled.button`
  background-color: #28a745; /* Verde para registrarse */
  color: white;
  padding: 15px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 20px;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #218838;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const LinkText = styled.p`
  margin-top: 25px;
  font-size: 0.95em;
  color: #666;

  a {
    color: #007bff;
    text-decoration: none;
    font-weight: bold;
    transition: color 0.2s ease;

    &:hover {
      color: #0056b3;
      text-decoration: underline;
    }
  }
`;

const Message = styled.p`
  margin-top: 20px;
  padding: 10px;
  border-radius: 5px;
  font-weight: bold;

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

function Register() {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dni, setDni] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const navigate = useNavigate(); // Hook para la redirección

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !dni ||
      !dateOfBirth
    ) {
      setMessage("Todos los campos son obligatorios.");
      setMessageType("error");
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
      // LÍNEA MODIFICADA: Ahora usa el template literal con las comillas invertidas (backticks)
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        // <--- MODIFICACIÓN AQUÍ
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
              name,             // ¡Añadido!
              lastName,         // ¡Añadido!
              phoneNumber,      // ¡Añadido!
              username, 
              email, 
              password, 
              dni, 
              dateOfBirth 
          }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Registro exitoso. Redirigiendo a login...");
        setMessageType("success");
        // Limpiar formulario
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setDni("");
        setDateOfBirth("");
        setName("");         // Añadido
        setLastName("");     // Añadido
        setPhoneNumber("");  // Añadido
        setTimeout(() => {
          navigate("/login"); // Redirige a la página de login usando navigate
        }, 2000);
      } else {
        setMessage(data.message || "Error en el registro.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      setMessage("Ocurrió un error de red o de servidor.");
      setMessageType("error");
    }
  };

  return (
    <RegisterPageContainer>
      <RegisterFormWrapper>
        <Title>Registrarse</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="regUsername">Usuario:</Label>
            <Input
              type="text"
              id="regUsername"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="regName">Nombre:</Label>
            <Input
              type="text"
              id="regName"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="regLastName">Apellido:</Label>
            <Input
              type="text"
              id="regLastname"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="regPhoneNumber">Telefono:</Label>
            <Input
              type="text"
              id="regPhoneNumber"
              name="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="regEmail">Email:</Label>
            <Input
              type="email"
              id="regEmail"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="regDni">DNI:</Label>
            <Input
              type="text"
              id="regDni"
              name="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
              pattern="\d{7,9}"
              title="El DNI debe contener entre 7 y 9 dígitos numéricos."
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="regDateOfBirth">Fecha de Nacimiento:</Label>
            <Input
              type="date"
              id="regDateOfBirth"
              name="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              max={new Date().toISOString().split("T")[0]}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="regPassword">Contraseña:</Label>
            <Input
              type="password"
              id="regPassword"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="regConfirmPassword">Confirmar Contraseña:</Label>
            <Input
              type="password"
              id="regConfirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
            />
          </FormGroup>
          <SubmitButton type="submit">Registrar</SubmitButton>
        </Form>
        <LinkText>
          ¿Ya tienes una cuenta? <a href="/login">Inicia sesión aquí</a>
        </LinkText>
        {message && <Message className={messageType}>{message}</Message>}
      </RegisterFormWrapper>
    </RegisterPageContainer>
  );
}

export default Register;
