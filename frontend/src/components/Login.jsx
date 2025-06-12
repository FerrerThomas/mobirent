import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Importa useNavigate para la redirección programática
import styled from "styled-components";
import { useAuth } from "../context/AuthContext.jsx"; // Importa useAuth
// Ya no necesitamos importar loginBackground

// Definimos la URL base de la API usando la variable de entorno de Vite
const API_BASE_URL = import.meta.env.VITE_API_URL; // <--- Ya estaba, ¡bien!

// Styled Components
const LoginPageContainer = styled.div`
  // Fondo sin imagen
  width: 100vw;
  height: 100vh;
  background: linear-gradient(
    to right,
rgb(86, 97, 255) 0%,
rgb(0, 64, 175) 100%
  ); /* Un gradiente azul/morado atractivo */
  // O un color sólido: background-color: #f0f2f5; /* Un gris claro suave */
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;

  // Ya no necesitamos el ::before overlay si el fondo es un color/gradiente simple
  /*
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 0;
    }
    */
`;

const LoginFormWrapper = styled.div`
  color: #000;
  background-color: rgba(
    255,
    255,
    255,
    0.95
  ); /* Fondo casi blanco con ligera transparencia */
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4); /* Sombra más pronunciada */
  text-align: center;
  width: 100%;
  max-width: 400px;
  z-index: 1; // Para que esté encima de cualquier fondo
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 30px;
  font-size: 2.5em;
`;

const Form = styled.form`
  color:#000;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  color: #000;
  text-align: left;
  margin-bottom: 10px;
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
  background-color: #007bff;
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
    background-color: #0056b3;
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

function Login() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const { login } = useAuth();
  const [twoFactorCode, setTwoFactorCode] = useState(""); // Nuevo estado para el código 2FA
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false); // Nuevo estado para controlar si se requiere 2FA
  const [userEmailFor2FA, setUserEmailFor2FA] = useState(""); // Para guardar el email y usarlo en la verificación 2FA
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setIsLoading(true);
    if (!email || !password) {
      setMessage("Por favor, introduce tu email y contraseña.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    try {
      // LÍNEA MODIFICADA
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Si el backend indica que se requiere 2FA (para admins)
        if (data.requiresTwoFactor) {
          setRequiresTwoFactor(true);
          setUserEmailFor2FA(email); // Guarda el email para la siguiente fase de verificación
          setMessage(data.message);
          setMessageType("info");
          setPassword(""); // Limpiar la contraseña una vez enviado el código 2FA
        } else {
          // Login normal (para usuarios no admin o si no se requiere 2FA)
          // Nota: Asegúrate de que tu función 'login' de useAuth pueda manejar todos los campos
          // que tu backend envía (token, username, role, _id, dni, dateOfBirth).
          // Los estoy pasando aquí asumiendo que tu backend los envía.
          const { token, username, role, _id, dni, dateOfBirth, name, lastName, phoneNumber } = data;
          login(token, username, role, _id, dni, dateOfBirth, name, lastName, phoneNumber); // Usa tu función de login del contexto

          setMessage(
            data.message || "Inicio de sesión exitoso. Redirigiendo..."
          );
          setMessageType("success");
          setPassword(""); // Limpiar la contraseña
          navigate("/home"); // Redirige a la página principal
        }
      } else {
        // Errores de credenciales inválidas, etc.
        setMessage(data.message || "Error en el inicio de sesión.");
        setMessageType("error");
        setPassword(""); // Limpiar la contraseña en caso de error
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setMessage("Ocurrió un error de red o de servidor.");
      setMessageType("error");
      setPassword(""); // Limpiar la contraseña en caso de error de red
    } finally {
      setIsLoading(false);
    }
  };

  // --- Nueva función para la verificación del código 2FA ---
  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setIsLoading(true);
    if (!twoFactorCode) {
      setMessage("Por favor, introduce el código de verificación.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    try {
      // LÍNEA MODIFICADA
      const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmailFor2FA, code: twoFactorCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Si la verificación 2FA es exitosa, el backend devolverá el JWT
        const { token, username, role, _id, dni, dateOfBirth, name, lastName, phoneNumber } = data;
        login(token, username, role, _id, dni, dateOfBirth, name, lastName, phoneNumber); // Usa tu función de login del contexto

        setMessage(data.message || "Verificación 2FA exitosa. Redirigiendo...");
        setMessageType("success");
        setTwoFactorCode(""); // Limpia el campo del código
        setRequiresTwoFactor(false); // Resetea el estado 2FA
        setTimeout(() => {
          navigate("/home"); // Redirige a la página principal
        }, 0);
      } else {
        // Errores de código inválido/expirado
        setMessage(data.message || "Error al verificar el código.");
        setMessageType("error");
        setTwoFactorCode(""); // Limpia el campo del código en caso de error
      }
    } catch (error) {
      console.error("Error al verificar el código 2FA:", error);
      setMessage(
        "Ocurrió un error de red o de servidor durante la verificación 2FA."
      );
      setMessageType("error");
      setTwoFactorCode(""); // Limpia el campo del código en caso de error de red
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginPageContainer>
      <LoginFormWrapper>
        <Title>Iniciar Sesión</Title>

        {!requiresTwoFactor ? ( // Mostrar formulario de login si no se requiere 2FA
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="email">Email:</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="password">Contraseña:</Label>
              <Input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </FormGroup>
            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading ? "Conectando..." : "Iniciar Sesión"}{" "}
              {/* <--- ASEGÚRATE DE QUE TU BOTÓN SE VEA ASÍ */}
            </SubmitButton>
          </Form>
        ) : (
          // Mostrar formulario de 2FA si se requiere
          <Form onSubmit={handleTwoFactorSubmit}>
            <p style={{ color: 'black', fontSize: '16px'}}>
              Se ha enviado un código de verificación a su email:{" "}
              <strong>{userEmailFor2FA}</strong>
            </p>
            <FormGroup>
              <Label htmlFor="twoFactorCode" >Código de Verificación:</Label>
              <Input
                type="text"
                id="twoFactorCode"
                name="twoFactorCode"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                required
                placeholder="Ingrese el código de 6 dígitos"
                maxLength="6" // Limita la entrada a 6 dígitos
                pattern="[0-9]{6}" // Asegura que solo se ingresen números y sean 6
                title="Por favor, ingrese un código numérico de 6 dígitos."
              />
            </FormGroup>
            <SubmitButton type="submit">Verificar Código</SubmitButton>
            {/* Opcional: botón para reenviar código, si implementas la ruta en el backend */}
            {/* <LinkText style={{marginTop: '15px'}}>¿No recibiste el código? <a href="#" onClick={handleResendCode}>Reenviar</a></LinkText> */}
          </Form>
        )}

        {!requiresTwoFactor && ( // Mostrar enlaces solo si no estamos en el flujo 2FA
          <>
            <LinkText>
              ¿No tienes una cuenta? <a href="/register">Regístrate aquí</a>
            </LinkText>
            <LinkText>
              ¿Olvidaste tu contraseña?{" "}
              <a href="/forgot-password">Restablecer aquí</a>
            </LinkText>
          </>
        )}
        {message && <Message className={messageType}>{message}</Message>}
      </LoginFormWrapper>
    </LoginPageContainer>
  );
}

export default Login;
