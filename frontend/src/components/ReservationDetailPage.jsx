import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getReservationById, cancelReservation } from '../api/reservations';


const Container = styled.div`
  max-width: 700px;
  margin: 60px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
`;

const Title = styled.h2`
  text-align: center;
  color: #007bff;
  margin-bottom: 20px;
`;

const Section = styled.div`
  margin-bottom: 20px;
  color: #333;
`;

const Label = styled.span`
  font-weight: bold;
  color: #333;
`;

const Value = styled.span`
  color: #555;
`;

const BackButton = styled.button`
  background-color: #6c757d;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: inline-block;
  margin-top: 20px;
  &:hover {
    background-color: #5a6268;
  }
`;
// ========= Modificaciones para botón y feedback =========
// Botón con estilos según estado y deshabilitado durante carga
const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== '$cancelled' && prop !== 'disabled'
})`
  background-color: ${props => (props.cancelled ? '#6c757d' : '#dc3545')};  /* Si ya está cancelada */
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};  /* Sin pointer si está deshabilitado */
  margin-right: 10px;
  opacity: ${props => (props.disabled ? 0.6 : 1)};  /* Menor opacidad si está desactivado */
  &:hover {
    background-color: ${props =>
      props.disabled 
        ? '' 
        : props.cancelled 
          ? '#5a6268' 
          : '#c82333'
    };  /* Hover condicional */
  }
`;

// Mensaje de feedback tras acción (error o éxito)
const Message = styled.p.withConfig({
  shouldForwardProp: (prop) => prop !== '$error'
})`
  margin-top: 20px;
  font-weight: bold;
  color: ${props => (props.error ? '#dc3545' : '#28a745')};  /* Rojo=error, verde=éxito */
  text-align: center;
`;

const ReminderMessage = styled.p`
  margin-top: 25px; // Espacio extra arriba
  padding: 15px;
  background-color: #e6f7ff; // Un azul claro
  border: 1px solid #91d5ff;
  border-radius: 8px;
  color: #0047b3; // Un azul más oscuro para el texto
  text-align: center;
  font-size: 0.95em;
  font-weight: 500;
`;

function ReservationDetailPage() {
  const { id } = useParams(); // este “id” es el _id de la reserva
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');  // Mensaje tras cancelar

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const fetchData = async () => {
      try {
        const data = await getReservationById(id);
        setReservation(data);
      } catch (err) {
        console.error('Error al cargar detalle de reserva:', err.response || err);
        setError('No se pudo obtener la información de la reserva.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isAuthenticated, navigate, location.pathname]);

  //Mostrar estado de carga o error
  if (loading) {
    return (
      <Container>
        <Title>Detalle de Reserva</Title>
        <p style={{ textAlign: 'center', color: '#555' }}>Cargando información…</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>Detalle de Reserva</Title>
        <ErrorMessage>{error}</ErrorMessage>
        <BackButton onClick={() => navigate(-1)}>Volver</BackButton>
      </Container>
    );
  }

  if (!reservation) {
    return (
      <Container>
        <Title>Detalle de Reserva</Title>
        <ErrorMessage>Reserva no encontrada.</ErrorMessage>
        <BackButton onClick={() => navigate(-1)}>Volver</BackButton>
      </Container>
    );
  }

  // Formato legible de fechas
  const start = new Date(reservation.startDate).toLocaleDateString('es-AR');
  const end   = new Date(reservation.endDate).toLocaleDateString('es-AR');


  const canCancel = reservation.status === 'confirmed';  // Solo cancelar si está confirmada

  // Manejador de la cancelación
  const handleCancel = async () => {
    if (!window.confirm('¿Seguro que deseas cancelar esta reserva?')) return;
    setActionMsg('');   // Limpia mensaje previo
    setLoading(true);   // Deshabilitar botón. marca como cargando
    try {
      const { refundAmount, refundType, message } = await cancelReservation(id);
      // Actualizar estado localmente para reflejar cambios
      setReservation(prev => ({
        ...prev,
        status: 'cancelled',
        refundAmount,
        canceledAt: new Date().toISOString()
      }));
      setActionMsg(`${message} (${refundType}, ARS ${refundAmount.toFixed(2)})`);  // Feedback
    } catch (err) {
        console.error('[ERROR cancelar]', err.response || err);
        // Mostrar mensaje del backend si lo hay
        const msg = err.response?.data?.message || 'Error al cancelar la reserva.';
        setActionMsg(msg);  // Mensaje de error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>Detalle de Reserva #{reservation.reservationNumber}</Title>

      <Section>
        <Label>Estado:</Label>{' '}
        <Value style={{ textTransform: 'capitalize' }}>{reservation.status}</Value>
      </Section>

      <Section>
        <Label>Vehículo:</Label>{' '}
        <Value>
          {reservation.vehicle.brand} {reservation.vehicle.model} (
          {reservation.vehicle.licensePlate})
        </Value>
      </Section>

      <Section>
        <Label>Fechas de alquiler:</Label>{' '}
        <Value>{start} – {end}</Value>
      </Section>

      <Section>
        <Label>Sucursal de Retiro:</Label>{' '}
        <Value>{reservation.pickupBranch.name} ({reservation.pickupBranch.address})</Value>
      </Section>

      <Section>
        <Label>Sucursal de Devolución:</Label>{' '}
        <Value>{reservation.returnBranch.name} ({reservation.returnBranch.address})</Value>
      </Section>

      <Section>
        <Label>Costo Total:</Label>{' '}
        <Value>ARS {reservation.totalCost.toFixed(2)}</Value>
      </Section>

      {reservation.paymentInfo && reservation.paymentInfo.status && (
        <Section>
          <Label>Pago:</Label>{' '}
          <Value style={{ textTransform: 'capitalize' }}>
            {reservation.paymentInfo.status}
          </Value>
        </Section>
      )}
      
      
      {/* Mostrar el mensaje de recordatorio solo si la reserva está confirmada */}
      {console.log('DEBUG [ReservationDetailPage]: reservation.status para recordatorio:', reservation.status)} // 5. Log de la condición exacta
      {reservation.status === 'confirmed' && (
        <ReminderMessage>
          Recibirás un recordatorio por email 2 días antes de la fecha de retiro de tu vehículo.
        </ReminderMessage>
      )}


      <div>
        <Button
          onClick={handleCancel}
          disabled={!canCancel || loading}
          cancelled={reservation.status==='cancelled'}
        >
          {reservation.status==='cancelled' ? 'Cancelada' : 'Cancelar Reserva'}
        </Button>
        <BackButton onClick={() => navigate('/my-reservations')}>
        Volver a Mi Historial
      </BackButton>
      </div>

      {actionMsg && (
        <Message error={reservation.status!=='cancelled'}>
          {actionMsg}
        </Message>
      )}

    </Container>
  );
}

export default ReservationDetailPage;
