// src/components/CreateReservationPage.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext.jsx";
import axios from "axios"; // ¡Importa axios!

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CreateReservationContainer = styled.div`
  padding: 80px 20px 40px;
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #333;
`;

const FormWrapper = styled.div`
  background-color: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
`;

const Title = styled.h2`
  color: #007bff;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2.5em;
`;

const Subtitle = styled.p`
  text-align: center;
  margin-bottom: 20px;
  color: #555;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #333;
  }
  input[type="text"],
  input[type="date"],
  select {
    width: 100%;
    padding: 12px;
    border: 1px solid #ced4da;
    border-radius: 5px;
    font-size: 1em;
    box-sizing: border-box;
  }
`;

const TotalCostDisplay = styled.div`
  background-color: #e9ecef;
  padding: 15px;
  border-radius: 8px;
  margin-top: 30px;
  margin-bottom: 30px;
  text-align: center;
  font-size: 1.5em;
  font-weight: bold;
  color: #28a745;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
`;

const StyledButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 14px 30px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: bold;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  &.secondary {
    background-color: #6c757d;
    &:hover {
      background-color: #5a6268;
    }
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  text-align: center;
  margin-top: 20px;
`;

const SuccessMessage = styled.p`
  color: #28a745;
  text-align: center;
  margin-top: 20px;
  font-weight: bold;
`;

function CreateReservationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getAuthToken } = useAuth(); // Función para obtener el token
  const [vehicle, setVehicle] = useState(null);
  const [branches, setBranches] = useState([]);
  const [pickupBranchId, setPickupBranchId] = useState("");
  const [returnBranchId, setReturnBranchId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Get today's date for date pickers
  const getMinDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const vehicleId = queryParams.get("vehicleId");
    console.log("DEBUG: useEffect para carga de datos iniciales activado.");
    console.log("DEBUG: vehicleId obtenido de la URL:", vehicleId);
    const initialPickupBranchId = queryParams.get("pickupBranchId");
    const initialPickupDate = queryParams.get("pickupDate");
    const initialReturnDate = queryParams.get("returnDate");

    if (!vehicleId) {
      setError("No se ha seleccionado ningún vehículo para la reserva.");
      setLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const token = getAuthToken(); // Obtener el token
        if (!token) {
          navigate("/login"); // Redirigir si no hay token
          return;
        }

        // 1. Fetch Vehicle Details
        const vehicleResponse = await axios.get(
          `${API_BASE_URL}/vehicles/${vehicleId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVehicle(vehicleResponse.data.data);

        // 2. Fetch Branches
        const branchesResponse = await axios.get(`${API_BASE_URL}/branches`, {
          headers: { Authorization: `Bearer ${token}` }, // Las ramas pueden ser rutas públicas o privadas
        });
        setBranches(branchesResponse.data);

        // Set initial values from query params
        setPickupBranchId(initialPickupBranchId || "");
        setPickupDate(initialPickupDate || getMinDate());
        setReturnDate(initialReturnDate || "");

        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos iniciales de reserva:", err);
        setError(
          "Error al cargar la información del vehículo o las sucursales."
        );
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [location.search, navigate, getAuthToken]);

  useEffect(() => {
    // Calculate total cost whenever dates or vehicle changes
    if (vehicle && pickupDate && returnDate) {
      // --- INICIO DE MODIFICACION PARA FECHAS EN CALCULO ---
      const [startYear, startMonth, startDay] = pickupDate
        .split("-")
        .map(Number);
      const [endYear, endMonth, endDay] = returnDate.split("-").map(Number);

      const start = new Date(startYear, startMonth - 1, startDay, 12, 0, 0); // Mes es 0-indexado
      const end = new Date(endYear, endMonth - 1, endDay, 12, 0, 0); // Mes es 0-indexado
      // --- FIN DE MODIFICACION PARA FECHAS EN CALCULO ---

      console.log("Vehicle price per day:", vehicle.pricePerDay);
      console.log("Pickup Date (raw):", pickupDate);
      console.log("Return Date (raw):", returnDate);
      console.log("Start Date Object:", start);
      console.log("End Date Object:", end);
      // Calculate days, ensuring dates are valid and start is before end
      if (start <= end) {
        const timeDiff = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        console.log("Time Diff (ms):", timeDiff);
        console.log("Diff Days:", diffDays);
        setTotalCost(vehicle.pricePerDay * diffDays);
      } else {
        setTotalCost(0); // Invalid date range
      }
    } else {
      setTotalCost(0);
    }
  }, [vehicle, pickupDate, returnDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (
      !vehicle ||
      !pickupBranchId ||
      !returnBranchId ||
      !pickupDate ||
      !returnDate
    ) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }

    if (new Date(pickupDate) > new Date(returnDate)) {
      setError(
        "La fecha de devolución no puede ser anterior a la fecha de retiro."
      );
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      // --- INICIO DE MODIFICACION PARA FECHAS ---
      // Parsear las fechas en formato YYYY-MM-DD
      const [startYear, startMonth, startDay] = pickupDate
        .split("-")
        .map(Number);
      const [endYear, endMonth, endDay] = returnDate.split("-").map(Number);

      // Crear objetos Date en la zona horaria local, especificando la hora a mediodía (12:00 PM)
      // Esto evita que, al convertirse a UTC, la fecha caiga en el día anterior.
      const pickupDateObject = new Date(
        startYear,
        startMonth - 1,
        startDay,
        12,
        0,
        0
      ); // Month is 0-indexed
      const returnDateObject = new Date(
        endYear,
        endMonth - 1,
        endDay,
        12,
        0,
        0
      ); // Month is 0-indexed

      // Convertir los objetos Date a formato ISO 8601 (UTC) para enviar al backend
      const startDateISO = pickupDateObject.toISOString();
      const endDateISO = returnDateObject.toISOString();
      // --- FIN DE MODIFICACION PARA FECHAS ---

      const reservationData = {
        vehicleId: vehicle._id,
        pickupBranchId: pickupBranchId,
        returnBranchId: returnBranchId,
        startDate: startDateISO, // <--- USA ESTA NUEVA VARIABLE
        endDate: endDateISO, // <--- Y ESTA NUEVA VARIABLE
        // Payment info is simplified for now, as discussed earlier, or can be added here
      };

      console.log(">>> Enviando a backend:", reservationData);

      const response = await axios.post(
        `${API_BASE_URL}/reservations`,
        reservationData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201) {
        //Obtenemos el reservationId que devolvió el backend
        const { reservationId } = response.data;

        // Redirigimos al usuario a la pag de pago
        navigate(`/pay/${reservationId}`);
      }
    } catch (err) {
      console.error(
        "Error al crear la reserva:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message ||
          "Error al crear la reserva. Por favor, inténtalo de nuevo."
      );
    }
  };

  if (loading) {
    return (
      <CreateReservationContainer>
        <p>Cargando datos de la reserva...</p>
      </CreateReservationContainer>
    );
  }

  if (error && !vehicle) {
    // Only show full error if vehicle details failed to load
    return (
      <CreateReservationContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </CreateReservationContainer>
    );
  }

  return (
    <CreateReservationContainer>
      <FormWrapper>
        <Title>Confirmar Reserva</Title>
        <Subtitle>
          Vehículo seleccionado: **{vehicle?.brand} {vehicle?.model}**
        </Subtitle>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <label htmlFor="vehicleId">ID del Vehículo:</label>
            <input
              type="text"
              id="vehicleId"
              value={vehicle?._id || ""}
              disabled
            />
          </FormGroup>

          <FormGroup>
            <label htmlFor="pickupBranch">Sucursal de Retiro:</label>
            <select
              id="pickupBranch"
              value={pickupBranchId}
              onChange={(e) => setPickupBranchId(e.target.value)}
              disabled
            >
              <option value="">Selecciona una sucursal de retiro</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label htmlFor="returnBranch">Sucursal de Devolución:</label>
            <select
              id="returnBranch"
              value={returnBranchId}
              onChange={(e) => setReturnBranchId(e.target.value)}
              required
            >
              <option value="">Selecciona una sucursal de devolución</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label htmlFor="pickupDate">Fecha de Retiro:</label>
            <input type="date" id="pickupDate" value={pickupDate} disabled />
          </FormGroup>

          <FormGroup>
            <label htmlFor="returnDate">Fecha de Devolución:</label>
            <input type="date" id="returnDate" value={returnDate} disabled />
          </FormGroup>

          <TotalCostDisplay>
            Costo Total Estimado: ${totalCost.toFixed(2)}
          </TotalCostDisplay>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

          <ButtonContainer>
            <StyledButton type="submit">Confirmar Reserva</StyledButton>
            <StyledButton
              type="button"
              className="secondary"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </StyledButton>
          </ButtonContainer>
        </form>
      </FormWrapper>
    </CreateReservationContainer>
  );
}

export default CreateReservationPage;
