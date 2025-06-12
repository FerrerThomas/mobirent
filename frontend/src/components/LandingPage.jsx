import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import background from "../assets/landing-background.jpg"; // Asegúrate de tener esta imagen en tu carpeta assets

// Definimos la URL base de la API usando la variable de entorno de Vite
const API_BASE_URL = import.meta.env.VITE_API_URL; // <--- LÍNEA AÑADIDA

// Styled Components
const LandingContainer = styled.div`
  width: 100vw; /* Ocupa el 100% del ancho del viewport */
  height: 100vh; /* Ocupa el 100% del alto del viewport */
  background-image: url(${background});
  background-size: cover; /* Escala la imagen para cubrir todo el contenedor, recortando si es necesario */
  background-position: center; /* Centra la imagen */
  background-repeat: no-repeat; /* Evita que la imagen se repita */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* Alinea al inicio verticalmente (esto ya lo tenías) */
  color: white;
  padding-top: 150px; /* Espacio para el contenido */
  box-sizing: border-box; /* Asegura que padding no sume al ancho/alto total */
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.21);
    z-index: 0;
  }

  * {
    z-index: 1;
  }
`;

const ContentWrapper = styled.div`
  text-align: center;
  margin-bottom: 50px;
`;

const Title = styled.h1`
  font-size: 3.5em;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 1.5em;
  margin-bottom: 40px;
`;

const SearchBar = styled.div`
  background-color: rgb(255, 255, 255); /* Amarillo */
  padding: 30px;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap; /* Permite que los elementos se envuelvan en pantallas pequeñas */
  gap: 15px;
  align-items: flex-end; /* Alinea los items en la parte inferior */
  box-shadow: 0 5px 15px rgba(255, 255, 255, 0.3);
  max-width: 900px;
  width: 90%;
  margin-top: 50px; /* Empuja la barra de búsqueda hacia abajo */
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1; /* Permite que los grupos de input tomen el espacio disponible */
  min-width: 200px; /* Asegura un ancho mínimo para cada input group */

  label {
    color: #333;
    margin-bottom: 5px;
    font-weight: bold;
    text-align: left;
  }

  input[type="text"],
  input[type="date"],
  select {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1em;
    width: 100%; /* Ocupa el ancho completo de su contenedor */
    box-sizing: border-box; /* Incluye padding y border en el ancho */
  }

  /* Estilo para el icono del calendario si lo necesitas, aunque el tipo="date" ya lo trae */
  input[type="date"] {
    position: relative;
  }
`;

const SearchButton = styled.button`
  background-color: rgb(0, 183, 255); /* Verde */
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: bold;
  transition: background-color 0.3s ease;
  min-width: 120px; /* Asegura que el botón no sea demasiado pequeño */

  &:hover {
    background-color: rgb(0, 0, 0);
  }
`;

// --- NUEVO STYLED COMPONENT PARA EL MENSAJE DE ERROR ---
const ErrorMessage = styled.p`
  color: red;
  font-size: 0.95em;
  width: 100%; /* Ocupa todo el ancho disponible */
  text-align: center;
  margin-top: 10px; /* Espacio arriba del mensaje */
  margin-bottom: 0; /* Asegura que no haya margen inferior extra */
  // Puedes ajustar el posicionamiento si quieres que flote o tenga una posición absoluta
  // Por ejemplo, para que aparezca justo debajo del SearchBar sin mover nada:
  // position: absolute;
  // bottom: -30px; // Ajusta según la altura de tu SearchBar y el tamaño de la fuente
  // left: 0;
  // right: 0;
`;

function LandingPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch branches from your backend
    const fetchBranches = async () => {
      try {
        // No se requiere token para obtener las sucursales en la LandingPage
        const response = await fetch(`${API_BASE_URL}/branches`); // <--- LÍNEA MODIFICADA
        const data = await response.json();
        if (response.ok) {
          setBranches(data);
        } else {
          setError(data.message || "Error al cargar sucursales");
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
        setError("No se pudo conectar al servidor para obtener sucursales.");
      }
    };

    fetchBranches();
  }, []);

    const handleSearch = () => {
        setError(null); // Limpiar cualquier error anterior

        // Si la sucursal también es obligatoria para la búsqueda (como tu select tiene 'required')
        if (!selectedBranch) {
            setError('Por favor, selecciona una sucursal de retiro.');
            return;
        }

        // NUEVO: Validación para asegurar que AMBAS fechas estén seleccionadas al inicio
        if (!pickupDate || !returnDate) {
            setError('Por favor, selecciona tanto la fecha de retiro como la de devolución.');
            return; // Detiene la función
        }

        // Lógica de validación existente para el orden de las fechas
        const pDate = new Date(pickupDate);
        const rDate = new Date(returnDate);

        // Resetea la hora para comparar solo las fechas
        pDate.setHours(0, 0, 0, 0);
        rDate.setHours(0, 0, 0, 0);

        if (rDate <= pDate) {
            setError('La fecha de devolución debe ser mayor a la fecha de retiro.');
            return; // Detiene la función si hay un error
        }

        // Redirige a la página Home con los parámetros de búsqueda en la URL
        const params = new URLSearchParams();
        if (selectedBranch) {
            params.append('branchId', selectedBranch);
        }
        if (pickupDate) {
            params.append('pickupDate', pickupDate);
        }
        if (returnDate) {
            params.append('returnDate', returnDate);
        }
        navigate(`/home?${params.toString()}`);
    };

  // Obtener la fecha actual para establecer la fecha mínima en el selector
  const getMinDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0"); // Months start at 0!
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <LandingContainer>
      {/* El Navbar ya se renderiza en App.js */}
      <ContentWrapper>
        <Title>Alquiler de Autos</Title>
        <Subtitle>Alquilar un auto jamás ha sido más fácil</Subtitle>
      </ContentWrapper>

            <SearchBar>
                <InputGroup>
                    <label htmlFor="branch">Sucursal de retiro:</label>
                    <select
                        id="branch"
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        required
                    >
                        <option value="">Selecciona una sucursal</option>
                        {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </InputGroup>

                <InputGroup>
                    <label htmlFor="pickupDate">Fecha para retirar el auto:</label>
                    <input
                        type="date"
                        id="pickupDate"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        min={getMinDate()} // Establece la fecha mínima como hoy
                        required
                    />
                </InputGroup>

                <InputGroup>
                    <label htmlFor="returnDate">Fecha de devolución:</label>
                    <input
                        type="date"
                        id="returnDate"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        min={pickupDate || getMinDate()} // La fecha de devolución no puede ser anterior a la de retiro
                        required
                    />
                </InputGroup>

        <SearchButton onClick={handleSearch}>Buscar</SearchButton>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </SearchBar>
    </LandingContainer>
  );
}

export default LandingPage;
