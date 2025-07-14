// frontend/src/components/VehicleManagementPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext"; // Asegúrate de que AuthContext esté en esta ruta
import axiosInstance from "../api/axiosInstance"; // Asegúrate de que esta ruta sea correcta

// **** INICIO: Styled Components ****
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

const ActionButton = styled.button`
  background-color: ${(props) => props.statusColor || "#007bff"};
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: bold;
  margin-top: 10px;
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

// **** Styled Components para el MODAL de Mantenimiento ****
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
// **** FIN: Styled Components para el MODAL de Mantenimiento ****

// **** Styled Component para REPORTE ****
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
// **** FIN: Styled Component para REPORTE ****

// **** NUEVO Styled Component para mensajes de alerta ****
const AlertMessage = styled.div`
  background-color: ${(props) =>
    props.type === "error" ? "#f8d7da" : "#d4edda"};
  color: ${(props) => (props.type === "error" ? "#721c24" : "#155724")};
  border: 1px solid
    ${(props) => (props.type === "error" ? "#f5c6cb" : "#c3e6cb")};
  border-radius: 5px;
  padding: 10px 15px;
  margin-top: 20px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: bold;
`;
// **** FIN: NUEVO Styled Component ****

// **** INICIO: Componente VehicleManagementPage ****
function VehicleManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Obtén el objeto user del contexto de autenticación
  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Error general de carga de la página
  const [actionError, setActionError] = useState(null); // <-- NUEVO: Error para acciones específicas (ej. update status)

  // --- ESTADOS PARA EL MODAL DE MANTENIMIENTO ---
  const [showMaintenanceReasonModal, setShowMaintenanceReasonModal] =
    useState(false);
  const [vehicleToMaintainId, setVehicleToMaintainId] = useState(null);
  const [maintenanceReasonInput, setMaintenanceReasonInput] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  // --- FIN: ESTADOS ---

  // --- ESTADOS PARA EL REPORTE DE MANTENIMIENTO ---
  const [maintenanceReport, setMaintenanceReport] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  // --- FIN: ESTADOS ---

  const fetchVehiclesAndBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const branchesResponse = await axiosInstance.get("/branches");
      setBranches(branchesResponse.data);

      const vehiclesResponse = await axiosInstance.get("/vehicles/all");
      setVehicles(vehiclesResponse.data);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError(
        err.response?.data?.message ||
          "Ocurrió un error de red o del servidor al cargar los datos."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMaintenanceReport = useCallback(async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      const response = await axiosInstance.get("/vehicles/reports/maintenance");
      setMaintenanceReport(response.data.report || []);
      setShowReport(true);
    } catch (err) {
      console.error("Error al cargar reporte de mantenimiento:", err);
      setReportError(
        err.response?.data?.message ||
          "Ocurrió un error al generar el reporte de mantenimiento."
      );
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    // Asegúrate de obtener el rol del usuario del contexto si usas useAuth
    // O si lo sigues guardando en localStorage, asegúrate de que sea consistente.
    // Si user (del useAuth) tiene el rol, es preferible usarlo.
    const role = user?.role || localStorage.getItem("userRole"); // Prioriza user.role del contexto
    setUserRole(role);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchVehiclesAndBranches();
  }, [navigate, fetchVehiclesAndBranches, user]); // Añadir 'user' a las dependencias

  // --- MODIFICACIÓN DE handleStatusToggle para gestionar errores y el modal ---
  const handleStatusToggle = async (vehicleId, currentStatus, type) => {
    setActionError(null); // Limpiar cualquier error de acción anterior
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (type === "maintenance") {
      if (!currentStatus) {
        // Si el vehículo NO está en mantenimiento (queremos ponerlo)
        setVehicleToMaintainId(vehicleId);
        setMaintenanceReasonInput("");
        setModalError(null);
        setShowMaintenanceReasonModal(true);
        return;
      } else {
        // Si el vehículo SÍ está en mantenimiento (queremos sacarlo)
        const updateBody = {
          needsMaintenance: false,
          isAvailable: true,
          maintenanceReason: null,
          maintenanceStartDate: null,
        };
        try {
          await axiosInstance.put(`/vehicles/${vehicleId}/status`, updateBody);
          fetchVehiclesAndBranches(); // Recargar datos para reflejar el cambio
        } catch (error) {
          console.error("Error al sacar de mantenimiento:", error);
          // CAMBIO: Usar setActionError en lugar de alert()
          setActionError(
            error.response?.data?.message ||
              "Error desconocido al sacar el vehículo de mantenimiento."
          );
        }
      }
    } else if (type === "available" && userRole === "admin") {
      const updateBody = { isAvailable: !currentStatus };
      if (!currentStatus) {
        // Si se marca como disponible, no puede estar en mantenimiento
        updateBody.needsMaintenance = false;
      }
      try {
        await axiosInstance.put(`/vehicles/${vehicleId}/status`, updateBody);
        fetchVehiclesAndBranches(); // Recargar datos
      } catch (error) {
        console.error("Error al cambiar disponibilidad:", error);
        // CAMBIO: Usar setActionError en lugar de alert()
        setActionError(
          error.response?.data?.message ||
            "Error desconocido al actualizar disponibilidad."
        );
      }
    } else if (type === "reserved" && userRole === "admin") {
      const updateBody = { isReserved: !currentStatus };
      if (!currentStatus) {
        // Si se marca como reservado, se vuelve no disponible
        updateBody.isAvailable = false;
      }
      try {
        await axiosInstance.put(`/vehicles/${vehicleId}/status`, updateBody);
        fetchVehiclesAndBranches(); // Recargar datos
      } catch (error) {
        console.error("Error al cambiar estado de reserva:", error);
        // CAMBIO: Usar setActionError en lugar de alert()
        setActionError(
          error.response?.data?.message ||
            "Error desconocido al actualizar reserva."
        );
      }
    }
  };

  // --- NUEVA FUNCIÓN PARA ENVIAR EL MOTIVO DE MANTENIMIENTO ---
  const handleMaintenanceReasonSubmit = async () => {
    if (!maintenanceReasonInput.trim()) {
      setModalError("El motivo de mantenimiento no puede estar vacío.");
      return;
    }

    setModalLoading(true);
    setModalError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const updateBody = {
      needsMaintenance: true,
      isAvailable: false,
      isReserved: false,
      maintenanceReason: maintenanceReasonInput.trim(),
    };

    try {
      await axiosInstance.put(
        `/vehicles/${vehicleToMaintainId}/status`,
        updateBody
      );
      setShowMaintenanceReasonModal(false); // Cerrar el modal
      setVehicleToMaintainId(null);
      setMaintenanceReasonInput("");
      fetchVehiclesAndBranches(); // Recargar datos para reflejar el cambio
    } catch (error) {
      console.error("Error al poner en mantenimiento:", error);
      setModalError(
        error.response?.data?.message ||
          "Error al poner el vehículo en mantenimiento."
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Función para cerrar el modal sin enviar
  const handleCloseMaintenanceModal = () => {
    setShowMaintenanceReasonModal(false);
    setVehicleToMaintainId(null);
    setMaintenanceReasonInput("");
    setModalError(null);
    setModalLoading(false);
  };
  // --- FIN: NUEVA FUNCIÓN ---

  const handleGoBack = () => {
    navigate("/panel-de-control");
  };

  const filteredVehicles = selectedBranchFilter
    ? vehicles.filter(
        (vehicle) =>
          vehicle.branch && vehicle.branch._id === selectedBranchFilter
      )
    : vehicles;

  if (loading) {
    return (
      <PageContainer style={{ justifyContent: "center", alignItems: "center" }}>
        <PageTitle>Cargando vehículos...</PageTitle>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer style={{ justifyContent: "center", alignItems: "center" }}>
        <PageTitle>Error: {error}</PageTitle>
        <Button onClick={handleGoBack} style={{ marginTop: "20px" }}>
          Volver a Home
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <FilterSidebar>
        <h3>Filtrar Vehículos</h3>
        <FilterGroup>
          <label htmlFor="branchFilter">Sucursal:</label>
          <select
            id="branchFilter"
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
          >
            <option value="">Todas las Sucursales</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name} ({branch.address})
              </option>
            ))}
          </select>
        </FilterGroup>
        <Button
          onClick={() => setSelectedBranchFilter("")}
          className="secondary"
          style={{ width: "100%" }}
        >
          Limpiar Filtro
        </Button>
        {userRole === "admin" && (
          <ReportButton
            onClick={fetchMaintenanceReport}
            disabled={reportLoading}
            style={{ width: "100%" }}
          >
            {reportLoading
              ? "Generando Reporte..."
              : "Generar Reporte Mantenimiento"}
          </ReportButton>
        )}
      </FilterSidebar>

      <MainContent>
        <PageTitle>Gestión de Vehículos</PageTitle>
        <PageSubText>
          Visualiza y gestiona el estado de los vehículos.
        </PageSubText>

        {/* Área para mostrar errores de acciones específicas */}
        {actionError && <AlertMessage type="error">{actionError}</AlertMessage>}

        {showReport && (
          <div style={{ marginBottom: "40px" }}>
            <PageTitle style={{ fontSize: "2em" }}>
              Reporte de Mantenimiento
            </PageTitle>
            {reportError && (
              <AlertMessage type="error">{reportError}</AlertMessage>
            )}
            {maintenanceReport.length === 0 ? (
              <PageSubText>
                No hay vehículos en mantenimiento actualmente.
              </PageSubText>
            ) : (
              <ReportTable>
                <thead>
                  <tr>
                    <th>Patente</th>
                    <th>Modelo</th>
                    <th>Sucursal</th>
                    <th>Fecha Ingreso Mantenimiento</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceReport.map((item, index) => (
                    <tr key={index}>
                      <td>{item.patente}</td>
                      <td>{item.modelo}</td>
                      <td>{item.sucursal}</td>
                      <td>{item.fechaIngresoMantenimiento}</td>
                      <td>{item.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </ReportTable>
            )}
            <Button
              onClick={() => setShowReport(false)}
              className="secondary"
              style={{ marginTop: "20px" }}
            >
              Cerrar Reporte
            </Button>
          </div>
        )}

        {filteredVehicles.length === 0 && !showReport ? (
          <PageSubText>
            No hay vehículos para mostrar con los filtros seleccionados.
          </PageSubText>
        ) : (
          <VehicleGrid>
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle._id}>
                <VehicleImage
                  src={
                    vehicle.photoUrl ||
                    "https://via.placeholder.com/250x150?text=No+Photo"
                  }
                  alt={`${vehicle.brand} ${vehicle.model}`}
                />
                <VehicleDetails>
                  <VehicleInfoGroupLeft>
                    <VehicleInfoTop>
                      <VehicleName>
                        {vehicle.brand} {vehicle.model}
                      </VehicleName>
                      <VehicleDescription>
                        {vehicle.type.charAt(0).toUpperCase() +
                          vehicle.type.slice(1)}
                      </VehicleDescription>
                    </VehicleInfoTop>

                    <VehicleSpecsContainer>
                      <VehicleSpecItem>
                        <span className="icon">🔢</span>Patente:{" "}
                        <span>{vehicle.licensePlate}</span>
                      </VehicleSpecItem>
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

                    <VehicleStatusInfo>
                      <StatusText
                        color={vehicle.needsMaintenance ? "orange" : "green"}
                      >
                        Mantenimiento: {vehicle.needsMaintenance ? "Sí" : "No"}
                      </StatusText>
                      {vehicle.needsMaintenance && (
                        <>
                          <StatusText color="#777">
                            Motivo:{" "}
                            {vehicle.maintenanceReason || "No especificado"}
                          </StatusText>
                          <StatusText color="#777">
                            Fecha Ingreso:{" "}
                            {vehicle.maintenanceStartDate
                              ? new Date(
                                  vehicle.maintenanceStartDate
                                ).toLocaleDateString("es-AR")
                              : "N/A"}
                          </StatusText>
                        </>
                      )}
                      <StatusText color={vehicle.isAvailable ? "green" : "red"}>
                        Disponibilidad:{" "}
                        {vehicle.isAvailable ? "Disponible" : "No Disponible"}
                      </StatusText>
                      <StatusText
                        color={vehicle.isReserved ? "orange" : "green"}
                      >
                        Reserva:{" "}
                        {vehicle.isReserved ? "Reservado" : "No Reservado"}
                      </StatusText>
                    </VehicleStatusInfo>
                  </VehicleInfoGroupLeft>

                  <VehicleActions>
                    {userRole === "employee" && (
                      <ActionButton
                        onClick={() =>
                          handleStatusToggle(
                            vehicle._id,
                            vehicle.needsMaintenance,
                            "maintenance"
                          )
                        }
                        statusColor={
                          vehicle.needsMaintenance ? "#dc3545" : "#28a745"
                        }
                        disabled={
                          vehicle.isReserved && !vehicle.needsMaintenance
                        }
                      >
                        {vehicle.needsMaintenance
                          ? "Sacar de Mantenimiento"
                          : "Poner en Mantenimiento"}
                      </ActionButton>
                    )}
                    {userRole === "admin" && (
                      <>
                        <ActionButton
                          onClick={() =>
                            handleStatusToggle(
                              vehicle._id,
                              vehicle.isAvailable,
                              "available"
                            )
                          }
                          statusColor={
                            vehicle.isAvailable ? "#dc3545" : "#28a745"
                          }
                          disabled={
                            vehicle.needsMaintenance || vehicle.isReserved
                          }
                        >
                          {vehicle.isAvailable
                            ? "Marcar No Disponible"
                            : "Marcar Disponible"}
                        </ActionButton>
                      </>
                    )}
                  </VehicleActions>
                </VehicleDetails>
              </VehicleCard>
            ))}
          </VehicleGrid>
        )}

        <Button
          onClick={handleGoBack}
          className="secondary"
          style={{ marginTop: "30px" }}
        >
          Volver a Panel de Control
        </Button>
      </MainContent>

      {/* **** MODAL PARA EL MOTIVO DE MANTENIMIENTO **** */}
      {showMaintenanceReasonModal && (
        <ModalOverlay>
          <ModalContent>
            <h2>Ingresar Motivo de Mantenimiento</h2>
            <p>
              Por favor, describe la razón por la cual el vehículo será puesto
              en mantenimiento.
            </p>
            <textarea
              value={maintenanceReasonInput}
              onChange={(e) => setMaintenanceReasonInput(e.target.value)}
              placeholder="Ej: Revisión de frenos, cambio de aceite, reparación de motor..."
              rows="5"
            />
            {modalError && <p style={{ color: "red" }}>{modalError}</p>}
            <ModalActions>
              <Button
                className="secondary"
                onClick={handleCloseMaintenanceModal}
                disabled={modalLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleMaintenanceReasonSubmit}
                disabled={modalLoading}
              >
                {modalLoading ? "Confirmando..." : "Confirmar Mantenimiento"}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
      {/* **** FIN: MODAL **** */}
    </PageContainer>
  );
}

export default VehicleManagementPage;
