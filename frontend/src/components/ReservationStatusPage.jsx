// frontend/src/pages/ReservationStatusPage.jsx
import React, { useState, useEffect, useCallback } from "react";
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
  gap: 20px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    padding-top: 20px;
    align-items: center;
  }
`;

const MainContent = styled.div`
  flex-grow: 1;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

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

const Button = styled.button`
  background-color: #007bff;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
  margin-top: 20px;

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
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const FilterSidebar = styled.div`
  width: 280px;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  align-self: flex-start;
  position: sticky;
  top: 100px;
  flex-shrink: 0;

  h3 {
    color: #007bff;
    margin-bottom: 20px;
    font-size: 1.5em;
  }

  @media (max-width: 768px) {
    width: 100%;
    position: static;
    top: auto;
    padding: 15px;
    margin-bottom: 20px;
    box-sizing: border-box;
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

  select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1em;
    box-sizing: border-box;
    margin-bottom: 10px;
  }
`;

const VehicleGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 30px;
  width: 100%;
`;

const VehicleCard = styled.div`
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 30px;
  width: 100%;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    padding: 15px;
    gap: 15px;
  }
`;

const VehicleImage = styled.img`
  width: 250px;
  height: 150px;
  object-fit: contain;
  border-radius: 8px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 90%;
    height: 180px;
  }
`;

const VehicleDetails = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  text-align: left;

  @media (max-width: 992px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
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
  gap: 8px;
  flex-grow: 1;
`;

const VehicleInfoTop = styled.div`
  // No necesita estilos específicos aquí
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
  display: inline-block;
  margin-top: 5px;
  font-weight: bold;
`;

const VehicleSpecsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 10px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const VehicleSpecItem = styled.p`
  font-size: 0.95em;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;

  span {
    font-weight: bold;
    color: #333;
  }

  .icon {
    color: #007bff;
    font-size: 1.1em;
  }
`;

const VehicleStatusInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
  font-size: 0.95em;
`;

const StatusText = styled.p`
  font-weight: bold;
  color: ${(props) => props.color || "#333"};
`;

const VehicleActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #eee;

  @media (max-width: 992px) {
    width: 100%;
    align-items: flex-start;
    padding-top: 15px;
  }
  @media (max-width: 768px) {
    align-items: center;
  }
`;

// **** NUEVOS STYLED COMPONENTS PARA EL MODAL ****
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: center;

  h2 {
    color: #007bff;
    font-size: 1.8em;
    margin-bottom: 10px;
  }

  p {
    color: #555;
    font-size: 1.1em;
  }

  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1em;
    min-height: 100px;
    resize: vertical;
    box-sizing: border-box;
  }

  button {
    margin-top: 10px;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
`;
// **** FIN: NUEVOS STYLED COMPONENTS PARA EL MODAL ****

// **** NUEVO STYLED COMPONENT PARA REPORTE ****
const ReportButton = styled(Button)`
  background-color: #17a2b8; /* Color info */
  &:hover {
    background-color: #138496;
  }
  margin-left: 10px; /* Espacio entre este y el botón de volver */
`;

const ReportTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  th,
  td {
    border: 1px solid #ddd;
    padding: 12px 15px;
    text-align: left;
  }

  th {
    background-color: #007bff;
    color: white;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.9em;
  }

  tr:nth-child(even) {
    background-color: #f2f2f2;
  }

  tr:hover {
    background-color: #e9ecef;
  }

  td {
    color: #333;
    font-size: 0.9em;
  }

  @media (max-width: 768px) {
    font-size: 0.8em;
    th,
    td {
      padding: 8px 10px;
    }
    /* Esto forzaría a las tablas a ser desplazables en pantallas pequeñas */
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  input {
    flex: 1;
    min-width: 250px;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1em;
  }

  button {
    padding: 12px 25px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: #0056b3;
    }
    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  }
`;

const ReservationDetailsContainer = styled.div`
  background-color: #fff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  text-align: left;

  h3 {
    color: #007bff;
    font-size: 1.8em;
    margin-bottom: 15px;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
  }

  p {
    font-size: 1.1em;
    margin-bottom: 8px;
    color: #333;
    span {
      font-weight: bold;
      color: #000;
    }
  }

  .status-text {
    font-weight: bold;
    font-size: 1.2em;
    color: ${(props) => {
      switch (props.$status) {
        case "confirmed":
          return "#28a745"; // Green
        case "pending":
          return "#ffc107"; // Yellow
        case "cancelled":
          return "#dc3545"; // Red
        case "picked_up":
          return "#17a2b8"; // Info blue
        case "returned":
          return "#6f42c1"; // Purple
        case "completed":
          return "#6c757d"; // Grey
        default:
          return "#333";
      }
    }};
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 25px;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

// Reutilizar ActionButton de VehicleManagementPage o crear uno específico
const ActionButton = styled.button`
  background-color: ${(props) => props.$bgColor || "#007bff"};
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: bold;
  transition: background-color 0.3s ease;
  white-space: nowrap;

  &:hover {
    filter: brightness(1.1);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

function ReservationStatusPage() {
  const navigate = useNavigate();
  const [reservationNumber, setReservationNumber] = useState("");
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null); // Para controlar permisos

  // Modal para confirmación de cancelación
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Modal para confirmar cambio de estado (ej. "Picked Up", "Returned")
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [statusChangeError, setStatusChangeError] = useState(null);
  const [statusToChangeTo, setStatusToChangeTo] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchReservation = useCallback(async () => {
    if (!reservationNumber) {
      setError("Por favor, ingresa un número de reserva.");
      setReservation(null);
      return;
    }

    setLoading(true);
    setError(null);
    setReservation(null); // Limpiar reserva anterior
    try {
      // Nota: El backend no tiene una ruta para buscar por reservationNumber directamente.
      // Opción 1 (ideal): Añadir una ruta en el backend: GET /api/reservations/search?number=RES-XYZ
      // Opción 2 (menos eficiente, pero funciona si no se puede modificar el backend fácilmente):
      // Obtener todas las reservas (si el rol lo permite) y filtrar en el frontend.
      // Por simplicidad y eficiencia, asumiremos que se puede buscar por ID o que se añadirá una ruta de búsqueda por número.
      // Dado que el reservationNumber es único, una búsqueda por este campo sería más apropiada.

      // Asumiendo que el ID de la reserva es el mismo que el reservationNumber para esta búsqueda por simplicidad,
      // o que se agregará un endpoint de búsqueda por reservationNumber.
      // Idealmente, se haría una llamada GET a `/api/reservations/byNumber/${reservationNumber}`

      // Por ahora, si solo tenemos getReservationById,
      // la búsqueda por "código de reserva" necesitaría que ese código sea el _id de MongoDB.
      // Si el código de reserva es el campo `reservationNumber` que se genera,
      // NECESITAMOS un endpoint en el backend que busque por `reservationNumber`.

      // AÑADIMOS TEMPORALMENTE: Simulamos la búsqueda por `_id` para hacer funcionar el esqueleto.
      // DEBES IMPLEMENTAR UN ENDPOINT EN EL BACKEND PARA BUSCAR POR `reservationNumber`.
    const response = await axiosInstance.get(`/reservations/byNumber/${reservationNumber}`); // Esto asume que el input es el _id, no el reservationNumber
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
  }, [reservationNumber]);

  const handleSearch = () => {
    fetchReservation();
  };

  const handleChangeStatus = async (newStatus) => {
    if (!reservation) return;

    setShowStatusConfirmModal(true);
    setStatusToChangeTo(newStatus);
    setStatusChangeError(null);
  };

  const confirmStatusChange = useCallback(async () => {
    if (!reservation || !statusToChangeTo) return;

    setStatusChangeLoading(true);
    setStatusChangeError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      let updateBody = { status: statusToChangeTo };

      // Lógica específica según el nuevo estado
      if (statusToChangeTo === "picked_up") {
        // Al recoger, el vehículo ya no está "reservado" sino "en uso"
        // y no disponible para otros.
        // Se asume que el backend actualiza el estado del vehículo,
        // pero podemos reforzar aquí también si fuera necesario
        await axiosInstance.put(
          `/vehicles/${reservation.vehicle._id}/status`,
          {
            isReserved: false,
            isAvailable: false, // Sigue no disponible porque está en uso
          }
        );
      } else if (statusToChangeTo === "returned") {
        // Al devolver, el vehículo vuelve a estar disponible (si no necesita mantenimiento)
        // y la reserva pasa a "completed" después de este paso.
        await axiosInstance.put(
          `/vehicles/${reservation.vehicle._id}/status`,
          {
            isReserved: false,
            isAvailable: !reservation.vehicle.needsMaintenance, // Vuelve a disponible si no está en mantenimiento
          }
        );
        updateBody.status = "completed"; // Una vez devuelto, la reserva se marca como completada
      }

      await axiosInstance.put(
        `/reservations/${reservation._id}/status`, // Asume que hay un endpoint para actualizar status
        updateBody
      );
      alert(`Reserva actualizada a estado: ${statusToChangeTo.replace('_', ' ')}`);
      setShowStatusConfirmModal(false);
      fetchReservation(); // Recargar la reserva para ver el nuevo estado
    } catch (err) {
      console.error(`Error al cambiar estado a ${statusToChangeTo}:`, err);
      setStatusChangeError(
        err.response?.data?.message ||
          `Error al cambiar el estado a ${statusToChangeTo.replace('_', ' ')}.`
      );
    } finally {
      setStatusChangeLoading(false);
    }
  }, [reservation, statusToChangeTo, navigate, fetchReservation]);


  const handleCancelReservation = () => {
    if (!reservation) return;
    setShowCancelConfirmModal(true);
    setCancelError(null);
  };

  const confirmCancelReservation = useCallback(async () => {
    if (!reservation) return;

    setCancelLoading(true);
    setCancelError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axiosInstance.put(
        `/reservations/${reservation._id}/cancel`
      );
      alert(response.data.message);
      setShowCancelConfirmModal(false);
      fetchReservation(); // Recargar la reserva para ver el estado de cancelación
    } catch (err) {
      console.error("Error al cancelar reserva:", err);
      setCancelError(
        err.response?.data?.message || "Error al cancelar la reserva."
      );
    } finally {
      setCancelLoading(false);
    }
  }, [reservation, navigate, fetchReservation]);

  const handleGoBack = () => {
    navigate("/panel-de-control");
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <PageContainer>
      <MainContent>
        <PageTitle>Estado y Gestión de Reservas</PageTitle>
        <PageSubText>
          Busca una reserva por su número y gestiona su estado.
        </PageSubText>

        <SearchContainer>
          <label htmlFor="reservationNumber">
            Ingrese el número de reserva:
          </label>
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
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Buscando..." : "Buscar Reserva"}
            </Button>
          </InputGroup>
          {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        </SearchContainer>

        {reservation && (
          <ReservationDetailsContainer $status={reservation.status}>
            <h3>Detalles de la Reserva: {reservation.reservationNumber}</h3>
            <p>
              <span>ID de Reserva:</span> {reservation._id}
            </p>
            <p>
              <span>Usuario:</span>{" "}
              {reservation.user
                ? `${reservation.user.username} (${reservation.user.email})`
                : "N/A"}
            </p>
            <p>
              <span>Vehículo:</span>{" "}
              {reservation.vehicle
                ? `${reservation.vehicle.brand} ${reservation.vehicle.model} (${reservation.vehicle.licensePlate})`
                : "N/A"}
            </p>
            <p>
              <span>Sucursal de Retiro:</span>{" "}
              {reservation.pickupBranch
                ? `${reservation.pickupBranch.name} (${reservation.pickupBranch.address})`
                : "N/A"}
            </p>
            <p>
              <span>Sucursal de Devolución:</span>{" "}
              {reservation.returnBranch
                ? `${reservation.returnBranch.name} (${reservation.returnBranch.address})`
                : "N/A"}
            </p>
            <p>
              <span>Fecha de Inicio:</span> {formatDate(reservation.startDate)}
            </p>
            <p>
              <span>Fecha de Fin:</span> {formatDate(reservation.endDate)}
            </p>
            <p>
              <span>Costo Total:</span> ARS {reservation.totalCost.toFixed(2)}
            </p>
            <p>
              <span>Estado Actual:</span>{" "}
              <span className="status-text">
                {reservation.status.replace("_", " ").toUpperCase()}
              </span>
            </p>
            {reservation.status === "cancelled" && (
              <>
                <p>
                  <span>Cancelada el:</span>{" "}
                  {formatDate(reservation.canceledAt)}
                </p>
                <p>
                  <span>Monto Reembolsado:</span> ARS{" "}
                  {reservation.refundAmount.toFixed(2)}
                </p>
              </>
            )}
            <p>
              <span>Pago:</span>{" "}
              {reservation.paymentInfo
                ? `Método: ${reservation.paymentInfo.method || "N/A"}, Estado: ${
                    reservation.paymentInfo.status || "N/A"
                  }`
                : "No hay información de pago"}
            </p>
            <p>
              <span>Creada el:</span> {formatDate(reservation.createdAt)}
            </p>

            {/* Acciones para empleados/administradores */}
            {(userRole === "employee" || userRole === "admin") && (
              <ActionsContainer>
                {/* Botón para "Picked Up" */}
                {reservation.status === "confirmed" && (
                  <ActionButton
                    onClick={() => handleChangeStatus("picked_up")}
                    $bgColor="#17a2b8" // Info blue
                    disabled={statusChangeLoading}
                  >
                    Marcar como Retirado
                  </ActionButton>
                )}

                {/* Botón para "Returned" */}
                {reservation.status === "picked_up" && (
                  <ActionButton
                    onClick={() => handleChangeStatus("returned")}
                    $bgColor="#6f42c1" // Purple
                    disabled={statusChangeLoading}
                  >
                    Marcar como Devuelto
                  </ActionButton>
                )}

                {/* Botón para Cancelar (visible si la reserva es confirmada) */}
                {reservation.status === "confirmed" && (
                  <ActionButton
                    onClick={handleCancelReservation}
                    $bgColor="#dc3545" // Red
                    disabled={cancelLoading}
                  >
                    Cancelar Reserva
                  </ActionButton>
                )}

                {/* Botón para Re-confirmar (si fuera necesario, ej. de pending a confirmed manualmente) */}
                {/* Puedes añadir más botones según los flujos de negocio */}
              </ActionsContainer>
            )}
          </ReservationDetailsContainer>
        )}

        <Button
          onClick={handleGoBack}
          className="secondary"
          style={{ marginTop: "30px" }}
        >
          Volver a Panel de Control
        </Button>
      </MainContent>

      {/* Modal de confirmación de cancelación */}
      {showCancelConfirmModal && (
        <ModalOverlay>
          <ModalContent>
            <h2>Confirmar Cancelación</h2>
            <p>
              ¿Estás seguro de que deseas cancelar la reserva{" "}
              <strong>#{reservation?.reservationNumber}</strong>? Esta acción no
              se puede deshacer.
            </p>
            {cancelError && <p style={{ color: "red" }}>{cancelError}</p>}
            <ModalActions>
              <Button
                className="secondary"
                onClick={() => setShowCancelConfirmModal(false)}
                disabled={cancelLoading}
              >
                No, Volver
              </Button>
              <Button onClick={confirmCancelReservation} disabled={cancelLoading}>
                {cancelLoading ? "Cancelando..." : "Sí, Cancelar"}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal de confirmación de cambio de estado */}
      {showStatusConfirmModal && (
        <ModalOverlay>
          <ModalContent>
            <h2>Confirmar Cambio de Estado</h2>
            <p>
              ¿Estás seguro de que deseas cambiar el estado de la reserva{" "}
              <strong>#{reservation?.reservationNumber}</strong> a{" "}
              **{statusToChangeTo?.replace("_", " ").toUpperCase()}**?
            </p>
            {statusChangeError && (
              <p style={{ color: "red" }}>{statusChangeError}</p>
            )}
            <ModalActions>
              <Button
                className="secondary"
                onClick={() => setShowStatusConfirmModal(false)}
                disabled={statusChangeLoading}
              >
                No, Volver
              </Button>
              <Button onClick={confirmStatusChange} disabled={statusChangeLoading}>
                {statusChangeLoading ? "Cambiando..." : "Sí, Confirmar"}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
}

export default ReservationStatusPage;