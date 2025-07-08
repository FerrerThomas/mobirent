// frontend/src/pages/ReservationDetailPageEmp.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Importa useParams
import styled from "styled-components";
import axiosInstance from "../api/axiosInstance";

const PageContainer = styled.div`
  background-color: #f0f2f5;
  min-height: 100vh;
  padding: 80px 20px 40px;
  box-sizing: border-box;
  color: #333;
  display: flex;
  justify-content: center; /* Centrado en lugar de flex-start para esta página */
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    padding-top: 20px;
    align-items: center;
  }
`;

const MainContent = styled.div`
  flex-grow: 1;
  max-width: 900px; /* Ancho máximo para el contenido principal */
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

// Omitimos FilterSidebar, VehicleGrid, VehicleCard, VehicleImage, etc.
// Ya que esta página solo mostrará una reserva específica, no una lista.

// **** STYLED COMPONENTS PARA EL MODAL ****
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
// **** FIN: STYLED COMPONENTS PARA EL MODAL ****

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

// *** STYLED COMPONENTS PARA LA SELECCIÓN DE ADICIONALES ***
const AdicionalesSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: left;

  h4 {
    color: #007bff;
    font-size: 1.4em;
    margin-bottom: 15px;
  }
`;

const AdicionalItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dotted #eee;

  &:last-child {
    border-bottom: none;
  }

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1em;
    color: #333;
    flex-grow: 1;
    cursor: pointer;
  }

  input[type="checkbox"] {
    transform: scale(1.3);
    margin-right: 5px;
  }

  input[type="number"] {
    width: 60px;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
    text-align: center;
    font-size: 1em;
  }

  span {
    font-weight: bold;
    color: #007bff;
  }
`;

const AdicionalesList = styled.div`
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 0 10px;
`;

const AdicionalesTotal = styled.p`
  font-size: 1.2em;
  font-weight: bold;
  color: #007bff;
  text-align: right;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
`;

function ReservationDetailPageEmp() { // Cambia el nombre del componente
  const navigate = useNavigate();
  const { id } = useParams(); // Obtiene el ID de la reserva de la URL
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true); // Inicia cargando la reserva por ID
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Modal para confirmación de cancelación
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Modal para confirmar cambio de estado (solo para 'returned')
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [statusChangeError, setStatusChangeError] = useState(null);
  const [statusToChangeTo, setStatusToChangeTo] = useState(null);

  // Estados para adicionales
  const [availableAdicionales, setAvailableAdicionales] = useState([]);
  const [selectedAdicionales, setSelectedAdicionales] = useState([]); // Array de { _id: adicionalId, quantity: N }
  // Nuevo estado para controlar el modal de adicionales
  const [showAdicionalesModal, setShowAdicionalesModal] = useState(false);
  const [adicionalesLoading, setAdicionalesLoading] = useState(false);
  const [adicionalesError, setAdicionalesError] = useState(null);

  // Estado para el motivo de mantenimiento
  const [maintenanceReason, setMaintenanceReason] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }

    // Cargar adicionales disponibles al montar el componente
    const fetchAdicionales = async () => {
      try {
        const response = await axiosInstance.get("/adicionales/available");
        setAvailableAdicionales(response.data);
      } catch (err) {
        console.error("Error al cargar adicionales:", err);
      }
    };
    fetchAdicionales();
  }, [navigate]);

  const fetchReservation = useCallback(async () => {
    if (!id) {
      setError("ID de reserva no proporcionado.");
      setReservation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setReservation(null);
    setSelectedAdicionales([]); // Limpiar adicionales seleccionados al cargar nueva reserva
    setMaintenanceReason(""); // Limpiar motivo de mantenimiento

    try {
      // Usa el ID de la URL para buscar la reserva
      const response = await axiosInstance.get(`/reservations/${id}`);
      setReservation(response.data);
      // Al cargar la reserva, pre-seleccionar los adicionales existentes
      if (response.data.adicionales && response.data.adicionales.length > 0) {
        setSelectedAdicionales(
          response.data.adicionales.map((item) => ({
            adicionalId: item.adicional._id,
            quantity: item.quantity,
          }))
        );
      }
    } catch (err) {
      console.error("Error al buscar reserva:", err);
      setError(
        err.response?.data?.message ||
          "Error al cargar la reserva. Asegúrate de que el ID es correcto y tienes permisos."
      );
    } finally {
      setLoading(false);
    }
  }, [id]); // Dependencia del ID de la URL

  useEffect(() => {
    fetchReservation(); // Llama a la función para cargar la reserva al montar o cambiar el ID
  }, [fetchReservation]);

  const handleChangeStatus = async (newStatus) => {
    if (!reservation) return;

    if (newStatus === "picked_up") {
      setStatusChangeLoading(true);
      setStatusChangeError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        setStatusChangeLoading(false);
        return;
      }
      try {
        await axiosInstance.put(
          `/reservations/${reservation._id}/status`,
          { status: newStatus }
        );
        alert(`Reserva actualizada a estado: ${newStatus.replace("_", " ")}`);
        fetchReservation();
      } catch (err) {
        console.error(`Error al cambiar estado a ${newStatus}:`, err);
        setStatusChangeError(
          err.response?.data?.message ||
            `Error al cambiar el estado a ${newStatus.replace("_", " ")}.`
        );
      } finally {
        setStatusChangeLoading(false);
      }
    } else if (newStatus === "returned") {
      setShowStatusConfirmModal(true);
      setStatusToChangeTo(newStatus);
      setStatusChangeError(null);
      setMaintenanceReason("");
    }
  };

  const handleAddAdicionales = () => {
    if (!reservation) return;
    setShowAdicionalesModal(true);
    setAdicionalesError(null);
    // Asegurarse de que los adicionales seleccionados reflejen los actuales de la reserva
    if (reservation.adicionales && reservation.adicionales.length > 0) {
      setSelectedAdicionales(
        reservation.adicionales.map((item) => ({
          adicionalId: item.adicional._id,
          quantity: item.quantity,
        }))
      );
    } else {
      setSelectedAdicionales([]);
    }
  };

  const handleAdicionalSelection = (adicionalId, isChecked) => {
    setSelectedAdicionales((prevSelected) => {
      if (isChecked) {
        return [...prevSelected, { adicionalId, quantity: 1 }];
      } else {
        return prevSelected.filter((item) => item.adicionalId !== adicionalId);
      }
    });
  };

  const handleAdicionalQuantityChange = (adicionalId, newQuantity) => {
    setSelectedAdicionales((prevSelected) =>
      prevSelected.map((item) =>
        item.adicionalId === adicionalId
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item
      )
    );
  };

  const confirmAddAdicionales = useCallback(async () => {
    if (!reservation) return;

    setAdicionalesLoading(true);
    setAdicionalesError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await axiosInstance.put(
        `/reservations/${reservation._id}/adicionales`,
        { adicionales: selectedAdicionales }
      );
      
      alert("Adicionales actualizados exitosamente.");
      setShowAdicionalesModal(false);
      fetchReservation();
    } catch (err) {
      console.error("Error al actualizar adicionales:", err);
      setAdicionalesError(
        err.response?.data?.message ||
          "Error al actualizar los adicionales de la reserva."
      );
    } finally {
      setAdicionalesLoading(false);
    }
  }, [reservation, navigate, fetchReservation, selectedAdicionales]);

  // *** CALCULAR EL TOTAL DE ADICIONALES SELECCIONADOS ***
  const totalAdicionalesCost = useMemo(() => {
    return selectedAdicionales.reduce((total, selectedAdicional) => {
      const adicional = availableAdicionales.find(
        (a) => a._id === selectedAdicional.adicionalId
      );
      if (adicional) {
        return total + selectedAdicional.quantity * adicional.price;
      }
      return total;
    }, 0);
  }, [selectedAdicionales, availableAdicionales]);
  // *** FIN CALCULAR EL TOTAL ***

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
      let updateReservationBody = { status: statusToChangeTo };

      if (statusToChangeTo === "returned") {
        if (!maintenanceReason || maintenanceReason.trim() === "") {
          setStatusChangeError("El motivo de mantenimiento es obligatorio al marcar como devuelto.");
          setStatusChangeLoading(false);
          return;
        }

        if (reservation.vehicle && reservation.vehicle._id) {
          try {
            await axiosInstance.put(
              `/vehicles/${reservation.vehicle._id}/status`,
              { needsMaintenance: true, maintenanceReason: maintenanceReason }
            );
            console.log(`Vehículo ${reservation.vehicle.licensePlate} (${reservation.vehicle._id}) marcado para mantenimiento.`);
          } catch (vehicleErr) {
            console.error("Error al actualizar el estado del vehículo a mantenimiento:", vehicleErr);
            setStatusChangeError(
              vehicleErr.response?.data?.message ||
              "Error al actualizar el estado del vehículo a mantenimiento. Intenta de nuevo."
            );
            setStatusChangeLoading(false);
            return;
          }
        } else {
          setStatusChangeError("No se encontró el ID del vehículo asociado a la reserva.");
          setStatusChangeLoading(false);
          return;
        }
      }

      await axiosInstance.put(
        `/reservations/${reservation._id}/status`,
        updateReservationBody
      );
      
      alert(`Reserva actualizada a estado: ${statusToChangeTo.replace("_", " ")}`);
      setShowStatusConfirmModal(false);
      setMaintenanceReason("");
      fetchReservation();

    } catch (err) {
      console.error(`Error al cambiar estado a ${statusToChangeTo}:`, err);
      setStatusChangeError(
        err.response?.data?.message ||
          `Error al cambiar el estado a ${statusToChangeTo.replace("_", " ")}.`
      );
    } finally {
      setStatusChangeLoading(false);
    }
  }, [reservation, statusToChangeTo, navigate, fetchReservation, maintenanceReason]);

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
      fetchReservation();
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
    // Vuelve a la página de búsqueda
    navigate("/reservation-status");
  };

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

  if (loading) {
    return (
      <PageContainer>
        <MainContent>
          <PageTitle>Cargando Reserva...</PageTitle>
          <PageSubText>Por favor, espera mientras cargamos los detalles.</PageSubText>
        </MainContent>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <MainContent>
          <PageTitle>Error</PageTitle>
          <PageSubText style={{ color: 'red' }}>{error}</PageSubText>
          <Button onClick={handleGoBack}>Volver a Búsqueda</Button>
        </MainContent>
      </PageContainer>
    );
  }

  if (!reservation) {
    return (
      <PageContainer>
        <MainContent>
          <PageTitle>Reserva No Encontrada</PageTitle>
          <PageSubText>No se pudo cargar la información de la reserva.</PageSubText>
          <Button onClick={handleGoBack}>Volver a Búsqueda</Button>
        </MainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MainContent>
        <PageTitle>Detalles de la Reserva</PageTitle>
        <PageSubText>
          Información completa y gestión para la reserva #{reservation.reservationNumber}.
        </PageSubText>

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
          {/* MOSTRAR ADICIONALES YA ASOCIADOS A LA RESERVA */}
          {reservation.adicionales && reservation.adicionales.length > 0 && (
            <AdicionalesSection>
              <h4>Adicionales de la Reserva:</h4>
              <ReportTable>
                <thead>
                  <tr>
                    <th>Adicional</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {reservation.adicionales.map((item) => (
                    <tr key={item.adicional._id}>
                      <td>{item.adicional.name}</td>
                      <td>{item.quantity}</td>
                      <td>ARS {item.itemPrice.toFixed(2)}</td>
                      <td>ARS {(item.quantity * item.itemPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </ReportTable>
            </AdicionalesSection>
          )}
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
              {/* Botón para "Marcar como Retirado" */}
              {reservation.status === "confirmed" && (
                <ActionButton
                  onClick={() => handleChangeStatus("picked_up")}
                  $bgColor="#17a2b8" // Info blue
                  disabled={statusChangeLoading}
                >
                  Marcar como Retirado
                </ActionButton>
              )}

              {/* Botón para "Agregar Adicionales" */}
              {(reservation.status === "confirmed" || reservation.status === "picked_up") && (
                <ActionButton
                  onClick={handleAddAdicionales}
                  $bgColor="#28a745" // Green
                  disabled={adicionalesLoading}
                >
                  Agregar Adicionales
                </ActionButton>
              )}

              {/* Botón para "Marcar como Devuelto" */}
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
            </ActionsContainer>
          )}
        </ReservationDetailsContainer>

        <Button
          onClick={handleGoBack}
          className="secondary"
          style={{ marginTop: "30px" }}
        >
          Volver a Búsqueda de Reservas
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

      {/* Modal de confirmación de cambio de estado (solo para 'returned') */}
      {showStatusConfirmModal && (
        <ModalOverlay>
          <ModalContent>
            <h2>Confirmar Cambio de Estado</h2>
            <p>
              ¿Estás seguro de que deseas cambiar el estado de la reserva{" "}
              <strong>#{reservation?.reservationNumber}</strong> a{" "}
              **{statusToChangeTo?.replace("_", " ").toUpperCase()}**?
            </p>

            {/* Sección para motivo de mantenimiento (solo si el estado es 'returned') */}
            {statusToChangeTo === "returned" && (
              <AdicionalesSection>
                <h4>Motivo de Mantenimiento:</h4>
                <textarea
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  placeholder="Describe el motivo por el cual el vehículo requiere mantenimiento..."
                  rows="4"
                  required
                />
                {statusChangeError && statusChangeError.includes("motivo") && (
                  <p style={{ color: "red", marginTop: "5px" }}>{statusChangeError}</p>
                )}
              </AdicionalesSection>
            )}

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

      {/* MODAL DEDICADO PARA AGREGAR/EDITAR ADICIONALES */}
      {showAdicionalesModal && (
        <ModalOverlay>
          <ModalContent>
            <h2>Gestionar Adicionales para Reserva #{reservation?.reservationNumber}</h2>
            <p>
              Selecciona los adicionales y sus cantidades para esta reserva.
            </p>

            <AdicionalesSection>
              <h4>Adicionales Disponibles:</h4>
              <AdicionalesList>
                {availableAdicionales.length > 0 ? (
                  availableAdicionales.map((adicional) => {
                    const isSelected = selectedAdicionales.some(
                      (item) => item.adicionalId === adicional._id
                    );
                    const currentQuantity = isSelected
                      ? selectedAdicionales.find(
                          (item) => item.adicionalId === adicional._id
                        ).quantity
                      : 0;

                    return (
                      <AdicionalItem key={adicional._id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              handleAdicionalSelection(
                                adicional._id,
                                e.target.checked
                              )
                            }
                          />
                          {adicional.name} (ARS {adicional.price.toFixed(2)})
                        </label>
                        {isSelected && (
                          <input
                            type="number"
                            min="1"
                            value={currentQuantity}
                            onChange={(e) =>
                              handleAdicionalQuantityChange(
                                adicional._id,
                                parseInt(e.target.value)
                              )
                            }
                          />
                        )}
                      </AdicionalItem>
                    );
                  })
                ) : (
                  <p>No hay adicionales disponibles.</p>
                )}
              </AdicionalesList>
              {/* Display the total cost of selected adicionales */}
                {selectedAdicionales.length > 0 && (
                  <AdicionalesTotal>
                    Total Adicionales: ARS {totalAdicionalesCost.toFixed(2)}
                  </AdicionalesTotal>
                )}
            </AdicionalesSection>

            {adicionalesError && (
              <p style={{ color: "red" }}>{adicionalesError}</p>
            )}
            <ModalActions>
              <Button
                className="secondary"
                onClick={() => setShowAdicionalesModal(false)}
                disabled={adicionalesLoading}
              >
                Cancelar
              </Button>
              <Button onClick={confirmAddAdicionales} disabled={adicionalesLoading}>
                {adicionalesLoading ? "Guardando..." : "Guardar Adicionales"}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
      
    </PageContainer>
  );
}

export default ReservationDetailPageEmp;