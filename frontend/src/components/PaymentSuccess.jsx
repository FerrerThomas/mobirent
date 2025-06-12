// frontend/src/components/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getReservationById } from '../api/reservations';

const Container = styled.div`
  max-width: 600px;
  margin: 80px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  text-align: center;
`;

const Title = styled.h2`
  color: #28a745;
  margin-bottom: 20px;
`;

const Section = styled.div`
  margin-bottom: 15px;
  text-align: left;
  line-height: 1.4;
  color: #333;
`;

const Label = styled.span`
  font-weight: bold;
  color: #333;
`;

const Value = styled.span`
  margin-left: 5px;
  color: #555;
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 30px;
  &:hover {
    background-color: #0056b3;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  margin-bottom: 20px;
`;

const ReminderMessage = styled.p`
  margin-top: 25px;
  padding: 15px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  color: #0047b3;
  text-align: center;
  font-size: 0.95em;
  font-weight: 500;
`;

function PaymentSuccess() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const fetchReservation = async () => {
      try {
        //console.log('Fetching reservation with ID:', reservationId); // <-- NUEVO LOG 1
        const data = await getReservationById(reservationId);
        //console.log('Reservation data received in frontend:', data); // <-- NUEVO LOG 2
        setReservation(data);
      } catch (err) {
        console.error('Error cargando reserva:', err.response || err);
        setError('No se pudo obtener la información de la reserva.');
      } finally {
        setLoading(false);
      }
    };
    fetchReservation();
  }, [isAuthenticated, reservationId, navigate]);

  if (loading) {
    return (
      <Container>
        <Title>Procesando Pago…</Title>
        <p>Cargando información de la reserva.</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>Ocurrió un error</Title>
        <ErrorMessage>{error}</ErrorMessage>
        <Button onClick={() => navigate('/my-reservations')}>Volver a Mis Reservas</Button>
      </Container>
    );
  }

  if (!reservation) {
    //console.log('Reservation object is null after loading finished.'); // <-- NUEVO LOG 3
    return (
      <Container>
        <Title>Reserva no encontrada</Title>
        <Button onClick={() => navigate('/my-reservations')}>Volver a Mis Reservas</Button>
      </Container>
    );
  }
  
  // AÑADE ESTOS LOGS JUSTO ANTES DE LA RENDERIZACIÓN DE DETALLES
  //console.log('Attempting to render reservation details:', reservation); // <-- NUEVO LOG 4
  //console.log('Reservation vehicle object:', reservation.vehicle);     // <-- NUEVO LOG 5
  //if (reservation.vehicle) {
   // console.log('Reservation vehicle brand:', reservation.vehicle.brand); // <-- NUEVO LOG 6 (Solo si vehicle existe)
  //} else {
  //  console.log('Reservation vehicle is UNDEFINED or NULL!'); // <-- NUEVO LOG 7
  //}


  // Formato legible
  const startDateStr = new Date(reservation.startDate).toLocaleDateString('es-AR');
  const endDateStr   = new Date(reservation.endDate).toLocaleDateString('es-AR');

  return (
    <Container>
      <Title>¡Pago Aprobado!</Title>

      <Section>
        <Label>Número de Reserva:</Label>
        <Value>{reservation.reservationNumber}</Value>
      </Section>

      <Section>
        <Label>Vehículo:</Label>
        <Value>
          {reservation.vehicle.brand} {reservation.vehicle.model} (
          {reservation.vehicle.licensePlate})
        </Value>
      </Section>

      <Section>
        <Label>Fechas:</Label>
        <Value>{startDateStr} – {endDateStr}</Value>
      </Section>

      <Section>
        <Label>Sucursal Retiro:</Label>
        <Value>{reservation.pickupBranch.name} ({reservation.pickupBranch.address})</Value>
      </Section>

      <Section>
        <Label>Sucursal Devolución:</Label>
        <Value>{reservation.returnBranch.name} ({reservation.returnBranch.address})</Value>
      </Section>

      <Section>
        <Label>Costo Total:</Label>
        <Value>ARS {reservation.totalCost.toFixed(2)}</Value>
      </Section>

      <Section>
        <Label>Estado:</Label>
        <Value style={{ textTransform: 'capitalize' }}>{reservation.status}</Value>
      </Section>
      {reservation.status === 'confirmed' && (
        <ReminderMessage>
          Recibirás un recordatorio por email 2 días antes de la fecha de retiro de tu vehículo.
        </ReminderMessage>
      )}
      <Button onClick={() => navigate('/my-reservations')}>Ir a Mis Reservas</Button>
    </Container>
  );
}

export default PaymentSuccess;
