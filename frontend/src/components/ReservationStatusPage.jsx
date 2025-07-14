// frontend/src/pages/ReservationStatusPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify"; // Para notificaciones

// Styled Components (Mantengo los que ya tenías)
const PageContainer = styled.div`
  background-color: #f0f2f5;
  min-height: 100vh;
  padding: 80px 20px 40px;
  box-sizing: border-box;
  color: #333;
  display: flex;
  justify-content: center;
  align-items: flex-start;

  @media (max-width: 768px) {
    padding-top: 20px;
  }
`;

const MainContent = styled.div`
  width: 100%;
  max-width: 900px; /* Ajustado para dar más espacio al listado general */
  padding: 40px;
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 20px;
    margin: 10px;
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
  margin-bottom: 40px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 0.9em;
    margin-bottom: 30px;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
  padding: 30px;
  background-color: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const InputLabel = styled.label`
  font-size: 1.1em;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  display: block;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 15px;
  align-items: flex-end;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }

  input {
    flex: 1;
    padding: 15px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1.1em;
    transition: border-color 0.3s ease;

    &:focus {
      outline: none;
      border-color: #007bff;
    }

    @media (max-width: 768px) {
      margin-bottom: 10px;
    }
  }
`;

const SearchButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: bold;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
  margin-top: 20px;
  font-size: 1em;
  text-align: center; /* Centrar el texto */
`;

const ReservationCard = styled.div`
  background-color: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 15px;
  padding: 30px;
  margin-top: 30px; /* Para separar de la sección de búsqueda */
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const ReservationNumber = styled.h2`
  font-size: 1.8em;
  color: #007bff;
  margin: 0;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 1.5em;
  }
`;

const StatusBadge = styled.span`
  background-color: ${(props) => {
    switch (props.status) {
      case "confirmed":
        return "#28a745";
      case "pending":
        return "#ffc107";
      case "cancelled":
        return "#dc3545";
      case "picked_up":
        return "#17a2b8";
      case "returned":
        return "#6f42c1";
      case "completed":
        return "#6c757d";
      default:
        return "#333";
    }
  }};
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: bold;
  text-transform: uppercase;
`;

const CardInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const InfoItem = styled.div`
  p {
    margin: 8px 0;
    font-size: 1em;
    color: #555;

    strong {
      color: #333;
      font-weight: bold;
    }
  }
`;

const ViewButton = styled.button`
  background-color: #28a745;
  color: white;
  padding: 15px 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2em;
  font-weight: bold;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    background-color: #218838;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
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
  transition: all 0.3s ease;
  margin-top: 30px;
  align-self: flex-start; /* Para que no ocupe todo el ancho si MainContent es flex */

  &:hover {
    background-color: #5a6268;
    transform: translateY(-2px);
  }
`;

// Estilos para el listado general
const ReservationListSection = styled.div`
  margin-top: 60px; /* Espacio para separar de la sección de búsqueda */
  padding-top: 40px;
  border-top: 1px dashed #e0e0e0;
  text-align: center;
`;

const ListTitle = styled.h2`
  font-size: 2.2em;
  color: #007bff;
  margin-bottom: 30px;
  text-align: center;
`;

const ReservationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr; /* Una columna para el listado simple */
  gap: 25px;
  margin-top: 20px;
`;

const NoResultsMessage = styled.div`
  padding: 30px;
  text-align: center;
  color: #666;
  font-size: 1.2em;
  background-color: #f8f8f8;
  border-radius: 10px;
  margin-top: 30px;
  border: 1px dashed #ddd;
`;

const Loader = () => (
  <div style={{ textAlign: "center", padding: "20px" }}>
    <p>Cargando reservas...</p>
    <div
      style={{
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #007bff",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        animation: "spin 1s linear infinite",
        margin: "10px auto",
      }}
    ></div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function ReservationStatusPage() {
  const navigate = useNavigate();
  // Estado para la búsqueda individual
  const [reservationNumber, setReservationNumber] = useState("");
  const [reservation, setReservation] = useState(null); // Contiene la reserva encontrada por número
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState(null);

  // Nuevo estado para el listado general de reservas
  const [allReservations, setAllReservations] = useState([]);
  const [loadingAllReservations, setLoadingAllReservations] = useState(true);
  const [errorAllReservations, setErrorAllReservations] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Función para buscar una reserva por número
  const handleSearch = async () => {
    if (!reservationNumber.trim()) {
      setErrorSearch("Por favor, ingresa un número de reserva.");
      setReservation(null); // Limpiar la reserva si el campo está vacío
      return;
    }

    setLoadingSearch(true);
    setErrorSearch(null);
    setReservation(null); // Limpiar resultado anterior al iniciar nueva búsqueda

    try {
      const response = await axiosInstance.get(
        `/reservations/byNumber/${reservationNumber}`
      );
      setReservation(response.data);
    } catch (err) {
      console.error("Error al buscar reserva:", err);
      // Si la reserva no se encuentra, el backend podría enviar 404.
      // Asegurarse de que `reservation` sea `null` para que el listado se muestre de nuevo.
      setReservation(null);
      setErrorSearch(
        err.response?.data?.message ||
          "Error al buscar la reserva. Asegúrate de que el número es correcto y tienes permisos."
      );
    } finally {
      setLoadingSearch(false);
    }
  };

  // Función para limpiar la búsqueda individual y mostrar el listado de nuevo
  const clearSearch = () => {
    setReservationNumber("");
    setReservation(null);
    setErrorSearch(null);
    // Opcional: Volver a cargar el listado si se ha modificado algo, o si quieres asegurarte que está actualizado
    // fetchAllReservations();
  };


  // Función para obtener todas las reservas
  const fetchAllReservations = useCallback(async () => {
    setLoadingAllReservations(true);
    setErrorAllReservations(null);
    setAllReservations([]);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      setLoadingAllReservations(false);
      return;
    }

    try {
      const response = await axiosInstance.get("/reservations/all-reservations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllReservations(response.data.reservations || []);
    } catch (err) {
      console.error("Error al cargar listado de reservas:", err);
      setErrorAllReservations(
        err.response?.data?.message || "Error al cargar el listado general de reservas."
      );
      toast.error(err.response?.data?.message || "Error al cargar el listado general de reservas.");
    } finally {
      setLoadingAllReservations(false);
    }
  }, [navigate]);

  // useEffect para cargar todas las reservas al montar el componente
  useEffect(() => {
    fetchAllReservations();
  }, [fetchAllReservations]);

  const handleViewReservation = (id) => {
    navigate(`/reservation-detail-emp/${id}`);
  };

  const handleGoBack = () => {
    navigate("/panel-de-control");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  return (
    <PageContainer>
      <MainContent>
        <PageTitle>Gestionar Reservas</PageTitle>
        <PageSubText>
          Busca una reserva específica o revisa el listado completo.
        </PageSubText>

        {/* Sección de búsqueda por número de reserva */}
        <SearchContainer>
          <InputLabel htmlFor="reservationNumber">
            Buscar por número de reserva:
          </InputLabel>
          <InputGroup>
            <input
              id="reservationNumber"
              type="text"
              value={reservationNumber}
              onChange={(e) => {
                setReservationNumber(e.target.value);
                if (e.target.value === "") { // Si el campo se vacía, limpiar la búsqueda
                  clearSearch();
                }
              }}
              placeholder="Ej: RES-1678901234567-890"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <SearchButton onClick={handleSearch} disabled={loadingSearch}>
              {loadingSearch ? "Buscando..." : "Buscar"}
            </SearchButton>
          </InputGroup>
          {reservationNumber && reservation && ( // Muestra el botón de limpiar solo si hay texto y una reserva encontrada
            <button onClick={clearSearch} style={{
              marginTop: '10px',
              padding: '8px 15px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}>Limpiar Búsqueda</button>
          )}
        </SearchContainer>

        {errorSearch && <ErrorMessage>{errorSearch}</ErrorMessage>}

        {/* Tarjeta de resultado de la búsqueda individual */}
        {reservation && ( // Solo muestra esta tarjeta si una reserva fue encontrada
          <ReservationCard>
            <CardHeader>
              <ReservationNumber>
                {reservation.reservationNumber}
              </ReservationNumber>
              <StatusBadge status={reservation.status}>
                {reservation.status.replace("_", " ")}
              </StatusBadge>
            </CardHeader>

            <CardInfo>
              <InfoItem>
                <p>
                  <strong>Usuario:</strong>{" "}
                  {reservation.user
                    ? `${reservation.user.username} (${reservation.user.email})`
                    : "N/A"}
                </p>
                <p>
                  <strong>Vehículo:</strong>{" "}
                  {reservation.vehicle
                    ? `${reservation.vehicle.brand} ${reservation.vehicle.model} (${reservation.vehicle.licensePlate})`
                    : "N/A"}
                </p>
              </InfoItem>

              <InfoItem>
                <p>
                  <strong>Período:</strong> {formatDate(reservation.startDate)} al{" "}
                  {formatDate(reservation.endDate)}
                </p>
                <p>
                  <strong>Costo Total:</strong> ARS {reservation.totalCost.toFixed(2)}
                </p>
              </InfoItem>
            </CardInfo>

            <ViewButton onClick={() => handleViewReservation(reservation._id)}>
              Ver Detalles
            </ViewButton>
          </ReservationCard>
        )}

        {/* Sección de listado de todas las reservas */}
        {/* Solo se muestra si NO hay una reserva individual encontrada */}
        {!reservation && (
          <ReservationListSection>
            <ListTitle>Todas las Reservas</ListTitle>

            {loadingAllReservations ? (
              <Loader />
            ) : errorAllReservations ? (
              <ErrorMessage>{errorAllReservations}</ErrorMessage>
            ) : allReservations.length > 0 ? (
              <ReservationGrid>
                {allReservations.map((res) => (
                  <ReservationCard key={res._id}>
                    <CardHeader>
                      <ReservationNumber>
                        {res.reservationNumber}
                      </ReservationNumber>
                      <StatusBadge status={res.status}>
                        {res.status.replace("_", " ")}
                      </StatusBadge>
                    </CardHeader>
                    {/*<CardInfo>
                      <InfoItem>
                        <p>
                          <strong>Usuario:</strong>{" "}
                          {res.user ? `${res.user.username}` : "N/A"}
                        </p>
                        <p>
                          <strong>Vehículo:</strong>{" "}
                          {res.vehicle
                            ? `${res.vehicle.brand} ${res.vehicle.model}`
                            : "N/A"}
                        </p>
                      </InfoItem>
                      <InfoItem>
                        <p>
                          <strong>Período:</strong> {formatDate(res.startDate)} al{" "}
                          {formatDate(res.endDate)}
                        </p>
                        <p>
                          <strong>Costo:</strong> ARS {res.totalCost.toFixed(2)}
                        </p>
                      </InfoItem>
                    </CardInfo>*/}
                    <ViewButton onClick={() => handleViewReservation(res._id)}>
                      Ver Detalle
                    </ViewButton>
                  </ReservationCard>
                ))}
              </ReservationGrid>
            ) : (
              <NoResultsMessage>No hay reservas para mostrar.</NoResultsMessage>
            )}
          </ReservationListSection>
        )}

        <BackButton onClick={handleGoBack}>
          Volver al Panel de Control
        </BackButton>
      </MainContent>
    </PageContainer>
  );
}

export default ReservationStatusPage;