// frontend/src/pages/ReservationStatusPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axiosInstance from "../api/axiosInstance";

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
  max-width: 800px;
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
`;

const ReservationCard = styled.div`
  background-color: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 15px;
  padding: 30px;
  margin-top: 30px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
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

  &:hover {
    background-color: #5a6268;
    transform: translateY(-2px);
  }
`;

function ReservationStatusPage() {
  const navigate = useNavigate();
  const [reservationNumber, setReservationNumber] = useState("");
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSearch = async () => {
    if (!reservationNumber.trim()) {
      setError("Por favor, ingresa un número de reserva.");
      setReservation(null);
      return;
    }

    setLoading(true);
    setError(null);
    setReservation(null);

    try {
      const response = await axiosInstance.get(
        `/reservations/byNumber/${reservationNumber}`
      );
      setReservation(response.data);
    } catch (err) {
      console.error("Error al buscar reserva:", err);
      setError(
        err.response?.data?.message ||
          "Error al buscar la reserva. Asegúrate de que el número es correcto y tienes permisos."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewReservation = () => {
    if (reservation) {
      // Navega a la nueva página de detalles con el ID de la reserva
      navigate(`/reservation-detail-emp/${reservation._id}`);
    }
  };

  const handleGoBack = () => {
    navigate("/panel-de-control");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <PageContainer>
      <MainContent>
        <PageTitle>Buscar Reserva</PageTitle>
        <PageSubText>
          Ingresa el número de reserva para buscar y gestionar su estado.
        </PageSubText>

        <SearchContainer>
          <InputLabel htmlFor="reservationNumber">
            Número de reserva:
          </InputLabel>
          <InputGroup>
            <input
              id="reservationNumber"
              type="text"
              value={reservationNumber}
              onChange={(e) => setReservationNumber(e.target.value)}
              placeholder="Ej: RES-1678901234567-890"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <SearchButton onClick={handleSearch} disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </SearchButton>
          </InputGroup>
        </SearchContainer>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {reservation && (
          <ReservationCard>
            <CardHeader>
              <ReservationNumber>
                #{reservation.reservationNumber}
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
                    ? `${reservation.user.username}`
                    : "N/A"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {reservation.user ? reservation.user.email : "N/A"}
                </p>
                <p>
                  <strong>Fecha de inicio:</strong>{" "}
                  {formatDate(reservation.startDate)}
                </p>
                <p>
                  <strong>Fecha de fin:</strong>{" "}
                  {formatDate(reservation.endDate)}
                </p>
              </InfoItem>

              <InfoItem>
                <p>
                  <strong>Vehículo:</strong>{" "}
                  {reservation.vehicle
                    ? `${reservation.vehicle.brand} ${reservation.vehicle.model}`
                    : "N/A"}
                </p>
                <p>
                  <strong>Patente:</strong>{" "}
                  {reservation.vehicle ? reservation.vehicle.licensePlate : "N/A"}
                </p>
                <p>
                  <strong>Costo total:</strong> ARS {reservation.totalCost.toFixed(2)}
                </p>
                <p>
                  <strong>Creada:</strong> {formatDate(reservation.createdAt)}
                </p>
              </InfoItem>
            </CardInfo>

            <ViewButton onClick={handleViewReservation}>
              Ver Reserva Completa
            </ViewButton>
          </ReservationCard>
        )}

        <BackButton onClick={handleGoBack}>
          Volver al Panel de Control
        </BackButton>
      </MainContent>
    </PageContainer>
  );
}

export default ReservationStatusPage;