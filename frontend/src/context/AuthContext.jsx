// frontend/src/context/AuthContext.js
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom"; // Para redireccionar dentro del contexto

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // CAMBIO: user ahora almacenará un objeto con todos los detalles del usuario
  const [user, setUser] = useState(null);

  const navigate = useNavigate(); // Hook para redireccionar

  // Función para cargar el estado de autenticación desde localStorage
  const loadAuthState = useCallback(() => {
    const token = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId"); // Añadido
    const storedUsername = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("userEmail"); // Añadido (si lo almacenas)
    const storedRole = localStorage.getItem("userRole");
    const storedDni = localStorage.getItem("userDni"); // Añadido
    const storedDateOfBirth = localStorage.getItem("userDateOfBirth"); // Añadido
    const storedName = localStorage.getItem("userName"); // Añadido
    const storedLastName = localStorage.getItem("userLastName"); // Añadido
    const storedPhoneNumber = localStorage.getItem("userPhoneNumber"); // Añadido

    if (token && storedUserId && storedUsername && storedRole) {
      setIsAuthenticated(true);
      setUser({
        _id: storedUserId,
        username: storedUsername,
        email: storedEmail, // Añadido
        role: storedRole,
        dni: storedDni, // Añadido
        dateOfBirth: storedDateOfBirth, // Añadido
        name: storedName, // Añadido
        lastName: storedLastName, // Añadido
        phoneNumber: storedPhoneNumber, // Añadido
      });
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  // Cargar el estado al inicio
  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  // Función para iniciar sesión (la llamarás desde tu componente Login)
  // CAMBIO: Nuevos parámetros para los detalles del usuario
  const login = (
    token,
    username,
    role,
    _id, // Añadido
    dni, // Añadido
    dateOfBirth, // Añadido
    name, // Añadido
    lastName, // Añadido
    phoneNumber, // Añadido
    email // Añadido (si lo pasas desde el login/register)
  ) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", _id); // Añadido
    localStorage.setItem("username", username);
    localStorage.setItem("userEmail", email); // Añadido
    localStorage.setItem("userRole", role);
    localStorage.setItem("userDni", dni); // Añadido
    localStorage.setItem("userDateOfBirth", dateOfBirth); // Añadido
    localStorage.setItem("userName", name); // Añadido
    localStorage.setItem("userLastName", lastName); // Añadido
    localStorage.setItem("userPhoneNumber", phoneNumber); // Añadido

    setIsAuthenticated(true);
    // CAMBIO: Almacenar todos los detalles en el objeto user
    setUser({
      _id,
      username,
      email, // Añadido
      role,
      dni, // Añadido
      dateOfBirth, // Añadido
      name, // Añadido
      lastName, // Añadido
      phoneNumber, // Añadido
    });
    navigate("/home"); // Redirige a /home después del login
  };

  // Función para cerrar sesión (la llamarás desde Home o Navbar)
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId"); // Añadido
    localStorage.removeItem("username");
    localStorage.removeItem("userEmail"); // Añadido
    localStorage.removeItem("userRole");
    localStorage.removeItem("userDni"); // Añadido
    localStorage.removeItem("userDateOfBirth"); // Añadido
    localStorage.removeItem("userName"); // Añadido
    localStorage.removeItem("userLastName"); // Añadido
    localStorage.removeItem("userPhoneNumber"); // Añadido

    setIsAuthenticated(false);
    setUser(null);
    navigate("/"); // Redirige a /login después del logout
    // window.location.reload(); // Opcional: Si persisten problemas, forzar recarga
  };

  const getAuthToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  // El valor que provee el contexto
  const authContextValue = {
    isAuthenticated,
    user, // Ahora 'user' contendrá { _id, username, email, role, dni, dateOfBirth, name, lastName, phoneNumber }
    login,
    logout,
    refreshAuthState: loadAuthState,
    getAuthToken,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};