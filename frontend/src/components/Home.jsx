import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
//import { useAuth } from "../context/AuthContext.jsx";


// Definimos la URL base de la API usando la variable de entorno de Vite
const API_BASE_URL = import.meta.env.VITE_API_URL; // <--- LÍNEA AÑADIDA

const HomePageContainer = styled.div`
  background-color: #f0f2f5;
  min-height: 100vh;
  padding: 80px 20px 40px;
  box-sizing: border-box;
  color: #333;
  display: flex; // Usamos flexbox para la distribución lateral
  gap: 20px; // Espacio entre el filtro y el contenido principal
  // No usamos justify-content: center aquí para que MainContent ocupe todo el espacio a la derecha
  align-items: flex-start; // Alinea la sidebar y el main content al inicio

  @media (max-width: 768px) {
    flex-direction: column; // Apila los elementos en pantallas pequeñas
    padding-top: 20px;
    align-items: center; // Centra los elementos apilados
  }
`;

const MainContent = styled.div`
  flex-grow: 1; // Permite que el contenido principal ocupe el espacio restante
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  // REMOVED: text-align: center; // Quitamos esto para que el contenido dentro de las tarjetas no se centre por defecto

  @media (max-width: 768px) {
    padding: 15px;
    margin-top: 20px;
    width: 100%; // Asegura que ocupe el 100% en móviles
  }
`;

const WelcomeTitle = styled.h1`
  font-size: 2.8em;
  color: #007bff;
  margin-bottom: 10px;
  text-align: center; // Mantenemos el título centrado

  @media (max-width: 768px) {
    font-size: 2em;
  }
`;

const SubText = styled.p`
  font-size: 1.1em;
  color: #555;
  margin-bottom: 20px;
  text-align: center; // Mantenemos el subtítulo centrado

  @media (max-width: 768px) {
    font-size: 0.9em;
  }
`;

const ButtonGroup = styled.div`
  margin-bottom: 30px;
  display: flex;
  flex-wrap: wrap; // Permite que los botones se envuelvan si no hay espacio
  justify-content: center; // Centra los botones
  gap: 10px; // Espacio entre los botones
`;

const ActionButton = styled(Link)`
  display: inline-block;
  background-color: #007bff;
  color: white;
  padding: 12px 25px;
  border-radius: 5px;
  text-decoration: none;
  font-size: 1.1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
  }

  &.secondary {
    background-color: #6c757d;
    &:hover {
      background-color: #5a6268;
    }
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 1em;
  }
`;

const FilterSidebar = styled.div`
  width: 280px; // Ancho fijo para la barra lateral
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  align-self: flex-start; // Alinea la barra lateral en la parte superior del contenedor flex
  position: sticky; // Hace que la barra lateral se quede fija al hacer scroll
  top: 100px; // Ajusta según la altura de tu Navbar (Navbar + un pequeño margen)
  flex-shrink: 0; // Evita que la sidebar se encoja

  h3 {
    color: #007bff;
    margin-bottom: 20px;
    font-size: 1.5em;
  }

  @media (max-width: 768px) {
    width: 100%;
    position: static; // Desactiva sticky en móviles
    top: auto;
    padding: 15px;
    margin-bottom: 20px;
    box-sizing: border-box; // Asegura que el padding no desborde el ancho
  }
`;

const FilterGroup = styled.div`
  margin-bottom: 20px;
  text-align: left;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #555;
  }

  input[type="date"],
  select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1em;
    box-sizing: border-box; // Incluye padding y border en el width
    margin-bottom: 10px;
  }
`;

const FilterButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  width: 100%;
  margin-top: 15px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

const VehicleGrid = styled.div`
  display: flex; // Usa flexbox
  flex-direction: column; // Apila las tarjetas verticalmente
  gap: 20px; // Espacio entre cada tarjeta de vehículo
  margin-top: 30px;
  width: 100%; // Ocupa todo el ancho disponible en MainContent
`;

const VehicleCard = styled.div`
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px; // Aumentado para que los elementos internos tengan más espacio
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  display: flex; // Habilita flexbox
  flex-direction: row; // Los elementos hijos (imagen y detalles) se alinean horizontalmente
  align-items: center; // Centra los elementos verticalmente en la tarjeta
  gap: 30px; // Más espacio entre la imagen y los detalles
  width: 100%; // Asegura que cada tarjeta ocupe el 100% del ancho del VehicleGrid

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    flex-direction: column; // Apila la imagen y los detalles en pantallas pequeñas
    align-items: center; // Centra el contenido cuando se apila
    padding: 15px;
    gap: 15px;
  }
`;

const VehicleImage = styled.img`
  width: 250px; // Un ancho fijo para la imagen, para que no ocupe demasiado
  height: 150px; // Altura fija
  object-fit: contain; // Usa 'contain' para que la imagen se vea completa dentro de su espacio
  border-radius: 8px;
  flex-shrink: 0; // Evita que la imagen se encoja
  // Eliminamos max-width: 35% para usar width fijo

  @media (max-width: 768px) {
    width: 90%; // Ocupa casi todo el ancho en móviles
    height: 180px;
  }
`;

const VehicleDetails = styled.div`
  flex-grow: 1; // Permite que los detalles ocupen el espacio restante
  display: flex;
  flex-direction: row; // Los elementos internos se alinean horizontalmente
  justify-content: space-between; // Distribuye el espacio entre el grupo izquierdo y el grupo derecho
  align-items: center; // Centra los grupos de contenido verticalmente
  text-align: left; // Alinea el texto de los detalles a la izquierda

  @media (max-width: 992px) {
    // Punto de quiebre para pantallas medianas
    flex-direction: column; // Apila los elementos en pantallas medianas
    align-items: flex-start; // Alinea a la izquierda cuando se apila
    gap: 15px; // Espacio entre las secciones apiladas
  }

  @media (max-width: 768px) {
    width: 100%;
    padding-left: 0;
    margin-top: 15px;
  }
`;

const VehicleInfoGroupLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px; // Espacio entre el nombre/tipo y las specs
  flex-grow: 1; // Permite que este grupo crezca
`;

const VehicleInfoTop = styled.div`
  // margin-bottom: 10px; // Ya manejado por el gap en VehicleInfoGroupLeft
`;

const VehicleName = styled.h3`
  font-size: 1.8em;
  margin-bottom: 5px;
  color: #333;

  @media (max-width: 768px) {
    font-size: 1.5em;
  }
`;

const VehicleDescription = styled.p`
  font-size: 0.9em;
  color: #777;
  background-color: #f0f0f0;
  padding: 5px 10px;
  border-radius: 5px;
  display: inline-block; // Para que el background solo cubra el texto
  margin-top: 5px;
  font-weight: bold; // Hacer el texto más legible
`;

const VehicleSpecsContainer = styled.div`
  display: flex; // Usamos flex para alinear horizontalmente
  flex-wrap: wrap; // Permite que los ítems se envuelvan si no hay espacio
  gap: 20px; // Espacio entre los ítems
  margin-top: 10px; // Espacio con la descripción superior

  @media (max-width: 768px) {
    flex-direction: column; // Apila los ítems en móviles
    gap: 8px;
  }
`;

const VehicleSpecItem = styled.p`
  font-size: 0.95em;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px; // Espacio entre icono y texto
  white-space: nowrap; // Evita que el texto se rompa en varias líneas

  span {
    font-weight: bold;
    color: #333;
  }

  .icon {
    color: #007bff;
    font-size: 1.1em; // Tamaño de los iconos
  }
`;

const VehicleRentInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end; // Alinea el precio y el botón a la derecha
  // margin-top: auto; // Ya no es necesario con el flex-direction: row en VehicleDetails
  // padding-top: 10px; // Ya no es necesario
  // border-top: 1px solid #eee; // Ya no es necesario

  @media (max-width: 992px) {
    // Mismo punto de quiebre que VehicleDetails
    width: 100%; // Ocupa todo el ancho cuando se apila
    align-items: flex-start; // Alinea a la izquierda cuando se apila
    padding-top: 15px;
    border-top: 1px solid #eee;
  }

  @media (max-width: 768px) {
    align-items: center; // Centra en móviles
  }
`;

const VehiclePrice = styled.p`
  font-size: 1.6em; // Más grande para el precio
  color: #333; // Color de texto normal para el precio
  font-weight: bold;
  margin-bottom: 10px; // Espacio entre precio y botón
  text-align: right; // Asegura que el precio esté a la derecha
  white-space: nowrap; // Evita que el precio se rompa

  span {
    color: #28a745; // Verde para el valor numérico
  }

  @media (max-width: 992px) {
    width: 100%;
    text-align: left; // Alinea a la izquierda cuando se apila
  }
  @media (max-width: 768px) {
    text-align: center; // Centra en móviles
  }
`;

const RentButtonStyled = styled.button`
  background-color: #f7b32b; // Color amarillo de tus imágenes de ejemplo
  color: black; // Color de texto para el botón amarillo
  padding: 12px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: bold;
  // align-self: flex-end; // Ya no necesario con flex-direction: column y align-items: flex-end en VehicleRentInfo
  transition: background-color 0.3s ease;
  min-width: 150px; // Ancho mínimo para el botón

  &:hover {
    background-color: #e0a120; // Un amarillo más oscuro al pasar el mouse
  }

  @media (max-width: 992px) {
    width: 100%; // Botón de ancho completo cuando se apila
  }
`;

const ErrorMessage = styled.p`
    color: red;
    font-size: 0.9em;
    margin-top: -10px; // Ajusta el margen para que no se vea tan separado
    margin-bottom: 10px;
    text-align: center;
`;

function Home() {
    //const { user, logout } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [branches, setBranches] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();

  const [selectedBranch, setSelectedBranch] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [error, setError] = useState(null);
    //const username = user ? user.username : null;
    //const userRole = user ? user.role : null;

  const vehicleTypes = [
    "sedan",
    "SUV",
    "compacto",
    "camioneta",
    "deportivo",
    "furgoneta",
    "otro",
  ];

  const getMinDate = useCallback(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // useCallback para la función de carga de vehículos
  const fetchAvailableVehicles = useCallback(async (token, filters) => {
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const query = new URLSearchParams(filters).toString();
      const url = `${API_BASE_URL}/vehicles${query ? `?${query}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      const data = await response.json();
      if (response.ok) {
        setVehicles(data);
      } else {
        console.error("Error al cargar vehículos:", data.message);
        setVehicles([]);
      }
    } catch (error) {
      console.error("Error de red al cargar vehículos:", error);
      setVehicles([]);
    }
  }, []);

  // useEffect unificado para cargar ramas, leer parámetros de la URL y realizar la primera carga de vehículos
  useEffect(() => {
    const token = localStorage.getItem("token");

    // 1. Cargar Sucursales
    const loadBranches = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/branches`);
        const data = await response.json();
        if (response.ok) {
          setBranches(data);
        } else {
          console.error("Error al cargar sucursales:", data.message);
        }
      } catch (err) {
        console.error("Error de red al cargar sucursales:", err);
      }
    };
    loadBranches();

    // 2. Leer los parámetros de la URL
    const queryParams = new URLSearchParams(location.search);
    const branchIdFromUrl = queryParams.get("branchId") || "";
    const pickupDateFromUrl = queryParams.get("pickupDate") || "";
    const returnDateFromUrl = queryParams.get("returnDate") || "";
    const typeFromUrl = queryParams.get("type") || "";

    // 3. Actualizar los estados de los filtros en el componente
    setSelectedBranch(branchIdFromUrl);
    setPickupDate(pickupDateFromUrl);
    setReturnDate(returnDateFromUrl);
    setSelectedType(typeFromUrl);

    // 4. Iniciar la carga de vehículos inmediatamente con estos parámetros
    const initialFilters = {
      branchId: branchIdFromUrl,
      pickupDate: pickupDateFromUrl,
      returnDate: returnDateFromUrl,
      type: typeFromUrl,
    };
    // Eliminar filtros vacíos del objeto para la solicitud inicial
    Object.keys(initialFilters).forEach(
      (key) => initialFilters[key] === "" && delete initialFilters[key]
    );

    fetchAvailableVehicles(token, initialFilters);
  }, [location.search, fetchAvailableVehicles]); // Depende de location.search, fetchAvailableVehicles y API_BASE_URL

  const handleApplyFilters = () => {
      setError(null); // Limpiar cualquier error anterior

      // **** INICIO DE LA NUEVA LÓGICA DE VALIDACIÓN DE FECHAS ****
      if (pickupDate && returnDate) {
          const pDate = new Date(pickupDate);
          const rDate = new Date(returnDate);

          pDate.setHours(0, 0, 0, 0);
          rDate.setHours(0, 0, 0, 0);

          // Validar que returnDate sea estrictamente mayor que pickupDate
          if (rDate <= pDate) {
              setError('La fecha de devolución debe ser mayor a la fecha de retiro.');
              return; // Detiene la función si hay un error
          }
      } else if (pickupDate && !returnDate) {
          setError('Por favor, selecciona una fecha de devolución.');
          return;
      } else if (!pickupDate && returnDate) {
          setError('Por favor, selecciona una fecha para retirar el auto.');
          return;
      } else if (!pickupDate && !returnDate) {
          setError('Por favor, selecciona una fecha para retirar el auto.');
          return;
      }

    // Redirigir a la misma página con los nuevos parámetros de búsqueda
    const params = new URLSearchParams();
    if (selectedBranch) params.append("branchId", selectedBranch);
    if (pickupDate) params.append("pickupDate", pickupDate);
    if (returnDate) params.append("returnDate", returnDate);
    if (selectedType) params.append("type", selectedType);

    // Usar navigate para cambiar la URL y que el useEffect con location.search detecte el cambio
    navigate(`/home?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSelectedBranch("");
    setPickupDate("");
    setReturnDate("");
    setSelectedType("");
    // Usar navigate para cambiar la URL y que el useEffect con location.search detecte el cambio
    navigate("/home");
  };

    //const handleLogout = () => {
    //    logout();
    //};

  return (
    <HomePageContainer>
      <FilterSidebar>
        <h3>Filtros de Búsqueda</h3>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <FilterGroup>
          <label htmlFor="branch">Sucursal:</label>
          <select
            id="branch"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup>
          <label htmlFor="pickupDate">Fecha de retiro:</label>
          <input
            type="date"
            id="pickupDate"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            min={getMinDate()}
          />
        </FilterGroup>

        <FilterGroup>
          <label htmlFor="returnDate">Fecha de devolución:</label>
          <input
            type="date"
            id="returnDate"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            min={pickupDate || getMinDate()}
          />
        </FilterGroup>

        <FilterGroup>
          <label htmlFor="vehicleType">Tipo de Vehículo:</label>
          <select
            id="vehicleType"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </FilterGroup>

        <FilterButton onClick={handleApplyFilters}>
          Aplicar Filtros
        </FilterButton>
        <FilterButton
          onClick={handleClearFilters}
          style={{ backgroundColor: "#6c757d", marginTop: "10px" }}
        >
          Limpiar Filtros
        </FilterButton>
      </FilterSidebar>

            <MainContent>
                <h2>Vehículos Disponibles para Alquilar:</h2>
                {vehicles.length === 0 ? (
                    <SubText>No hay vehículos disponibles en este momento con los filtros seleccionados.</SubText>
                ) : (
                    <VehicleGrid>
                        {vehicles.map((vehicle) => (
                            <VehicleCard key={vehicle._id}>
                                <VehicleImage
                                    src={
                                        vehicle.photoUrl ||
                                        "https://via.placeholder.com/250x150?text=No+Photo"
                                    }
                                    alt={`${vehicle.brand} ${vehicle.model}`}
                                />
                                <VehicleDetails>
                                    {/* Contenedor para el grupo izquierdo de información */}
                                    <VehicleInfoGroupLeft>
                                        <VehicleInfoTop>
                                            <VehicleName>
                                                {vehicle.brand} {vehicle.model}
                                            </VehicleName>
                                            <VehicleDescription>
                                                {vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}
                                            </VehicleDescription>
                                        </VehicleInfoTop>

                    <VehicleSpecsContainer>
                      <VehicleSpecItem>
                        <span className="icon">👤</span>Capacidad:{" "}
                        <span>{vehicle.capacity}</span>
                      </VehicleSpecItem>
                      <VehicleSpecItem>
                        <span className="icon">⚙️</span>Transmisión:{" "}
                        <span>
                          {vehicle.transmission.charAt(0).toUpperCase() +
                            vehicle.transmission.slice(1)}
                        </span>
                      </VehicleSpecItem>
                      {vehicle.branch && (
                        <VehicleSpecItem>
                          <span className="icon">📍</span>Sucursal:{" "}
                          <span>{vehicle.branch.name}</span>
                        </VehicleSpecItem>
                      )}
                    </VehicleSpecsContainer>
                  </VehicleInfoGroupLeft>

                  {/* SECCIÓN DE PRECIO Y BOTÓN (A la derecha) */}
                  <VehicleRentInfo>
                    <VehiclePrice>
                      Alquiler por Día:{" "}
                      <span>${vehicle.pricePerDay.toFixed(2)}</span>
                    </VehiclePrice>
                    <RentButtonStyled
                      onClick={() => {
                        // Redirige a la página de creación de reserva con el ID del vehículo y otros filtros si existen
                        const params = new URLSearchParams();
                        params.append("vehicleId", vehicle._id);
                        // Aseguramos que solo se pasen si tienen un valor, para evitar agregar '?pickupBranchId='
                        if (selectedBranch)
                          params.append("pickupBranchId", selectedBranch);
                        if (pickupDate) params.append("pickupDate", pickupDate);
                        if (returnDate) params.append("returnDate", returnDate);

                        navigate(`/create-reservation?${params.toString()}`);
                      }}
                    >
                      Reservar
                    </RentButtonStyled>
                  </VehicleRentInfo>
                </VehicleDetails>
              </VehicleCard>
            ))}
          </VehicleGrid>
        )}
      </MainContent>
    </HomePageContainer>
  );
}

export default Home;
