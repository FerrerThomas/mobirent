// frontend/src/pages/AdminReportsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axiosInstance from "../api/axiosInstance";
// Importa el componente ResponsivePie de Nivo
import { ResponsivePie } from '@nivo/pie';

// Styled Components (mantén todos los que ya tienes, incluyendo PageContainer, MainContent, etc.)
// Asegúrate de que ChartContainer esté definido, como lo estaba con Recharts
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
    flex-direction: column;
    padding-top: 20px;
    align-items: center;
  }
`;

const MainContent = styled.div`
  flex-grow: 1;
  max-width: 900px;
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

const StatCard = styled.div`
  background-color: #e9f5ff; /* Light blue background */
  border-left: 5px solid #007bff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;

  h3{
    color: #007bff;
    font-size: 1.5em;
    margin-bottom: 10px;
  }

  p {
    font-size: 2.2em;
    font-weight: bold;
    color: #333;
  }
`;

const DetailedStatsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  justify-content: center;
`;

const DetailedStatCard = styled(StatCard)`
  flex: 1;
  min-width: 250px;
  text-align: center;
  background-color: #f8f9fa;
  border-left: 5px solid #6c757d;
  
  /* ***** CAMBIO CLAVE AQUÍ: Reduce el padding vertical ***** */
  /* El primer valor es para top/bottom, el segundo para left/right */
  padding: 0px 20px; /* Reducido de 20px a 10px en vertical */
  /* Si quieres aún menos, prueba con 5px: padding: 5px 20px; */
  /* ********************************************************* */
  
  h3 {
    color: #495057;
    font-size: 1.3em;
    /* Si aún necesitas reducir más, considera ajustar el margin-bottom de h3 */
    /* margin-bottom: 5px; */ 
  }
  p {
    font-size: 1.8em;
    font-weight: bold;
    color: #333;
    /* Si aún necesitas reducir más, considera ajustar el margin-top de p */
    /* margin-top: 5px; */
  }

  &.confirmed { border-left-color: #28a745; }
  &.picked_up { border-left-color: #6f42c1; }
  &.returned { border-left-color: #17a2b8; }
  &.cancelled { border-left-color: #dc3545; }
`;

const ChartContainer = styled.div`
  width: 60%;
  height: 600px; /* Altura definida para el gráfico */
  margin-top: -370px; /* Aumentamos el margen superior para más separación de las estadísticas */
  margin-bottom: 300px; /* Aumentamos el margen inferior para más separación de la lista */
  margin-left: -70px;    /* Establece el margen izquierdo en 0 */
  margin-right: auto;  /* Esto empuja el elemento hacia la izquierda al consumir el espacio restante a la derecha */
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ErrorMessage = styled.p`
  color: red;
  text-align: center;
  margin-top: 20px;
`;

const LoadingMessage = styled.p`
  text-align: center;
  margin-top: 20px;
  font-size: 1.2em;
  color: #6c757d;
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

const ReportSection = styled.div`
  margin-top: 40px;
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
`;

const ReportTitle = styled.h2`
  font-size: 2em;
  color: #007bff;
  margin-bottom: 20px;
  text-align: center;
`;

// Estilo para el contenedor del botón de toggle, para centrarlo
const ToggleButtonContainer = styled.div`
  text-align: center;
  margin-bottom: 20px; /* Espacio debajo del botón antes de la tabla */
`;


const ReservationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-size: 0.9em;

  th,
  td {
    padding: 12px 15px;
    border: 1px solid #ddd;
    text-align: left;
  }

  th {
    background-color: #007bff;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  tr:nth-child(even) {
    background-color: #f8f8f8;
  }

  tr:hover {
    background-color: #f1f1f1;
  }
`;

const StatusIndicator = styled.span`
  display: inline-block;
  padding: 5px 10px;
  border-radius: 5px;
  font-weight: bold;
  color: white;
  background-color: ${(props) => {
    switch (props.status) {
      case "confirmed":
        return "#28a745"; // Verde
      case "picked_up":
        return "#6f42c1"; // Violeta
      case "returned":
        return "#17a2b8"; // Celeste
      case "cancelled":
        return "#dc3545"; // Rojo
      default:
        return "#6c757d"; // Gris por defecto
    }
  }};
`;

// Función de utilidad para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

function AdminReportsPage() {
  const navigate = useNavigate();
  const [revenueStats, setRevenueStats] = useState(null); 
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState(null);

  const [reservations, setReservations] = useState([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState(null);
  
  // Nuevo estado para controlar la visibilidad de las reservas
  const [showReservations, setShowReservations] = useState(false); 

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }
    if (role !== "admin" && role !== "employee") {
      navigate("/");
      return;
    }

    fetchBillingStatistics();
    fetchReservationsForReport();
  }, [navigate]);

  const fetchBillingStatistics = useCallback(async () => {
    setBillingLoading(true);
    setBillingError(null);
    try {
      const response = await axiosInstance.get("/reservations/total-revenue");
      setRevenueStats(response.data);
    } catch (err) {
      console.error("Error al cargar estadísticas de facturación:", err);
      setBillingError(
        err.response?.data?.message ||
          "Error al cargar las estadísticas de facturación. Asegúrate de que el endpoint está disponible y tienes permisos."
      );
    } finally {
      setBillingLoading(false);
    }
  }, []);

  const fetchReservationsForReport = useCallback(async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      const response = await axiosInstance.get("/reservations/report");
      setReservations(response.data.data);
    } catch (err) {
      console.error("Error al cargar las reservas para el reporte:", err);
      setReportError(
        err.response?.data?.message ||
          "Error al cargar las reservas para el reporte. Asegúrate de que el endpoint está disponible y tienes permisos."
      );
    } finally {
      setReportLoading(false);
    }
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (billingLoading || reportLoading) {
    return (
      <PageContainer>
        <MainContent>
          <PageTitle>Cargando Reportes...</PageTitle>
          <LoadingMessage>Por favor, espera mientras cargamos los datos.</LoadingMessage>
        </MainContent>
      </PageContainer>
    );
  }

  if (billingError || reportError) {
    return (
      <PageContainer>
        <MainContent>
          <PageTitle>Error al cargar reportes</PageTitle>
          <ErrorMessage>{billingError || reportError}</ErrorMessage>
          <Button onClick={() => { fetchBillingStatistics(); fetchReservationsForReport(); }}>Reintentar</Button>
          <Button onClick={handleGoBack} className="secondary" style={{ marginLeft: "10px" }}>Volver</Button>
        </MainContent>
      </PageContainer>
    );
  }

  // Prepara los datos para el gráfico de Nivo
  const pieChartData = revenueStats ? [
    { id: 'Confirmadas', value: revenueStats.confirmedRevenue || 0 },
    { id: 'Retiradas', value: revenueStats.pickedUpRevenue || 0 }, // Cambiado de 'Recogidas' a 'Retiradas' para consistencia
    { id: 'Devueltas', value: revenueStats.returnedRevenue || 0 },
  ].filter(item => item.value > 0) : [];

  // Colores para las secciones del gráfico de Nivo (puedes ajustar si quieres)
  const PIE_COLORS_MAP = {
    'Confirmadas': '#28a745', // Verde
    'Retiradas': '#6f42c1', // Violeta // Cambiado de 'Recogidas' a 'Retiradas' para consistencia
    'Devueltas': '#17a2b8', // Celeste
  };

  const getNivoColor = (slice) => PIE_COLORS_MAP[slice.id];

  return (
    <PageContainer>
      <MainContent>
        <PageTitle>Reporte de Facturación y Reservas</PageTitle>
        {/* Aquí la PageSubText fue eliminada en tu última versión, si la necesitas, vuelve a añadirla aquí */}

        {revenueStats && (
          <>
            {pieChartData.length > 0 ? (
                <ChartContainer>
                    <ResponsivePie
                        data={pieChartData}
                        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                        innerRadius={0.5} // Esto lo convierte en un donut chart
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        // Utiliza la función para aplicar los colores personalizados
                        colors={getNivoColor} 
                        borderWidth={1}
                        borderColor={{
                            from: 'color',
                            modifiers: [
                                [ 'darker', 0.2 ]
                            ]
                        }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#333333"
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: 'color' }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{
                            from: 'color',
                            modifiers: [
                                [ 'darker', 2 ]
                            ]
                        }}
                        // Leyenda del gráfico
                        legends={[
                            {
                                anchor: 'bottom',
                                direction: 'row',
                                justify: false,
                                translateX: 0,
                                translateY: 56,
                                itemsSpacing: 0,
                                itemWidth: 100,
                                itemHeight: 18,
                                itemTextColor: '#999',
                                itemDirection: 'left-to-right',
                                itemOpacity: 1,
                                symbolSize: 18,
                                symbolShape: 'circle',
                                effects: [
                                    {
                                        on: 'hover',
                                        style: {
                                            itemTextColor: '#000'
                                        }
                                    }
                                ]
                            }
                        ]}
                        tooltipFormat={(value) => `ARS ${value.toFixed(2)}`} // Formato del tooltip
                    />
                </ChartContainer>
            ) : (
                <p style={{ textAlign: "center", color: "#6c757d", marginTop: "20px" }}>
                    No hay datos de facturación disponibles para el gráfico de ingresos (confirmadas, recogidas, devueltas).
                </p>
            )}
            <StatCard>
              <h3>Facturación Total Generada</h3>
              <p>ARS {revenueStats.totalRevenue !== null ? revenueStats.totalRevenue.toFixed(2) : "N/A"}</p>
            </StatCard>

            <DetailedStatsContainer>
              <DetailedStatCard className="confirmed">
                <h3>Reservas Confirmadas</h3>
                <p>ARS {revenueStats.confirmedRevenue !== null ? revenueStats.confirmedRevenue.toFixed(2) : "0.00"}</p>
              </DetailedStatCard>
              <DetailedStatCard className="picked_up">
                <h3>Reservas Retiradas</h3> {/* Se mantiene 'Retiradas' aquí */}
                <p>ARS {revenueStats.pickedUpRevenue !== null ? revenueStats.pickedUpRevenue.toFixed(2) : "0.00"}</p>
              </DetailedStatCard>
              <DetailedStatCard className="returned">
                <h3>Reservas Devueltas</h3>
                <p>ARS {revenueStats.returnedRevenue !== null ? revenueStats.returnedRevenue.toFixed(2) : "0.00"}</p>
              </DetailedStatCard>
              <DetailedStatCard className="cancelled">
              <h3>Reservas Canceladas</h3>
              <p>
                Total: ARS {revenueStats.cancelledAmount !== null ? revenueStats.cancelledAmount.toFixed(2) : "0.00"}
                <br /> {/* Salto de línea para la siguiente información */}
                Rembolsado: ARS {revenueStats.cancelledRefundAmount !== null ? revenueStats.cancelledRefundAmount.toFixed(2) : "0.00"}
              </p>
            </DetailedStatCard>
            </DetailedStatsContainer>
          </>
        )}

        <ReportSection>
          <ReportTitle>Listado de Reservas</ReportTitle>
          <ToggleButtonContainer> {/* Contenedor para centrar el botón */}
            <Button onClick={() => setShowReservations(!showReservations)}>
              {showReservations ? "Ocultar Listado de Reservas" : "Mostrar Listado de Reservas"}
            </Button>
          </ToggleButtonContainer>
          
          {/* Renderizado condicional: la tabla solo se muestra si showReservations es true */}
          {showReservations && (
            <>
              {reservations.length > 0 ? (
                <ReservationTable>
                  <thead>
                    <tr>
                      <th>Nº de Reserva</th>
                      <th>Fecha de Inicio</th>
                      <th>Monto Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => (
                      <tr key={reservation._id}>
                        <td>{reservation.reservationNumber}</td>
                        <td>{formatDate(reservation.startDate)}</td>
                        <td>ARS {reservation.totalCost.toFixed(2)}</td>
                        <td>
                          <StatusIndicator status={reservation.status}>
                            {reservation.status}
                          </StatusIndicator>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </ReservationTable>
              ) : (
                <p style={{ textAlign: "center", color: "#6c757d" }}>No se encontraron reservas.</p>
              )}
            </>
          )}
        </ReportSection>

        <Button onClick={handleGoBack} className="secondary">
          Volver
        </Button>
      </MainContent>
    </PageContainer>
  );
}

export default AdminReportsPage;