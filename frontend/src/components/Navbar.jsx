// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import logoImage from '../assets/logo.png'; // Asegúrate de tener tu logo aquí, o cambia a un texto

// Styled Components para el Navbar
const Nav = styled.nav`
    background-color: #000; /* Fondo negro para la barra de navegación */
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: fixed; /* Fijo en la parte superior */
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000; /* Asegura que esté por encima de otros elementos */
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); /* Sutil sombra */
    box-sizing: border-box; /* Incluye padding en el ancho total */
`;

const LogoContainer = styled(Link)`
    display: flex;
    align-items: center;
    text-decoration: none;
    color: white; /* Color del texto si es un texto, o para el hover */
    font-size: 1.8em;
    font-weight: bold;

    img {
        height: 40px; /* Tamaño del logo */
        margin-right: 10px;
    }
`;

const AuthButtons = styled.div`
    display: flex;
    gap: 15px; /* Espacio entre los botones */
`;

const AuthButton = styled(Link)`
    background-color: transparent;
    color: white;
    border: 1px solid white;
    padding: 10px 20px;
    border-radius: 5px;
    text-decoration: none;
    font-size: 1em;
    transition: all 0.3s ease;

    &:hover {
        background-color: white;
        color: #000;
    }

    /* Estilo para el botón de iniciar sesión específico si lo deseas diferente */
    &.login-button {
        background-color: #007bff; /* Azul para iniciar sesión */
        border-color: #007bff;
        &:hover {
            background-color: #0056b3;
            border-color: #0056b3;
            color: white; /* Mantiene el color blanco en hover */
        }
    }
`;

const DropdownContainer = styled.div`
    position: relative;
    display: inline-block;
`;

const DropdownButton = styled.button`
    background-color: transparent;
    color: white;
    border: 1px solid white;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 1em;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background-color: white;
        color: #000;
    }
`;

const DropdownContent = styled.div`
    display: none;
    position: absolute;
    background-color: #333;
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
    right: 0; /* Alinea el dropdown a la derecha del botón */
    border-radius: 5px;
    overflow: hidden;

    ${DropdownContainer}:hover & {
        display: block; /* Muestra el contenido cuando el contenedor principal está en hover */
    }

    a {
        color: white;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
        text-align: left; /* Alinea el texto a la izquierda */

        &:hover {
            background-color: #555;
        }
    }

    button {
        color: white;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;

        &:hover {
            background-color: #555;
        }
    }
`;


const Navbar = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        navigate('/home'); // Redirige a la LandingPage después de cerrar sesión
    };

    return (
        <Nav>
            <LogoContainer to="/">
                {/* Puedes usar una imagen de logo o texto */}
                { <img src={logoImage} alt="MobiRent Logo" />}
                Alquilando
            </LogoContainer>

            <AuthButtons>
                {username ? (
                    <DropdownContainer>
                        <DropdownButton>
                            Hola, {username} ({userRole.toUpperCase()})
                        </DropdownButton>
                        <DropdownContent>
                            {/* Opciones según el rol, si es necesario */}
                            {userRole === 'admin' && (
                                <Link to="/admin-reports">Reportes</Link>
                            )}
                            {userRole === 'employee' && (
                                <Link to="/vehicles-management">Gestión Vehículos</Link>
                            )}
                            {/* ... otras opciones de perfil si las tienes */}
                            <button onClick={handleLogout}>Cerrar Sesión</button>
                        </DropdownContent>
                    </DropdownContainer>
                ) : (
                    <>
                        <AuthButton to="/login" className="login-button">Iniciar Sesión</AuthButton>
                        <AuthButton to="/register">Registrarse</AuthButton>
                    </>
                )}
            </AuthButtons>
        </Nav>
    );
};

export default Navbar;