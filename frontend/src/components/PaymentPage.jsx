// frontend/src/components/PaymentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { payReservation } from '../api/payments';
import axiosInstance from '../api/axiosInstance';


const Container = styled.div`
  max-width: 550px; /* Un poco más ancho para más espacio */
  margin: 80px auto;
  padding: 30px; /* Más padding */
  background-color: #f8f9fa; /* Fondo ligeramente gris */
  border-radius: 12px; /* Bordes más suaves */
  box-shadow: 0 8px 25px rgba(0,0,0,0.15); /* Sombra más pronunciada */
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; /* Fuente moderna */
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 30px; /* Más espacio */
  color: #0056b3; /* Un azul más oscuro y profesional */
  font-size: 2em; /* Título más grande */
  font-weight: 600; /* Un poco más audaz */
`;

const SectionTitle = styled.h3`
  color: #0056b3;
  margin-top: 25px;
  margin-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px; /* Más espacio entre grupos */
  label {
    display: block;
    font-weight: bold;
    margin-bottom: 8px; /* Más espacio debajo de la etiqueta */
    color: #495057; /* Un gris oscuro */
    font-size: 0.95em;
  }
  input {
    width: 100%;
    padding: 12px; /* Más padding en los inputs */
    border: 1px solid #ced4da; /* Borde más suave */
    border-radius: 6px; /* Bordes más redondeados */
    font-size: 1.05em; /* Fuente un poco más grande */
    box-sizing: border-box;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    &:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25); /* Sombra al enfocar */
      outline: none;
    }
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 15px; /* Espacio entre los inputs de expiry y cvv */
  ${FormGroup} {
    flex: 1; /* Permite que ocupen el espacio disponible */
    margin-bottom: 0; /* Elimina el margen inferior si ya está en FormGroup */
  }
`;

const SubmitButton = styled.button`
  background-color: #28a745;
  color: white;
  padding: 15px 25px; /* Más padding */
  border: none;
  border-radius: 8px; /* Bordes más redondeados */
  font-size: 1.1em; /* Fuente más grande */
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  margin-top: 25px; /* Más espacio arriba */
  transition: background-color 0.3s ease, transform 0.2s ease;
  &:hover {
    background-color: #218838;
    transform: translateY(-2px); /* Pequeño efecto al pasar el mouse */
  }
  &:disabled {
    background-color: #a0d4a0; /* Color más claro para disabled */
    cursor: not-allowed;
    transform: none;
  }
`;

const Message = styled.p`
  margin-top: 20px; /* Más espacio arriba */
  padding: 12px; /* Añadir padding */
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  font-size: 1.05em;
  color: ${props => (props.$isError ? '#721c24' : '#155724')}; /* Color de texto más oscuro */
  background-color: ${props => (props.$isError ? '#f8d7da' : '#d4edda')}; /* Fondo más claro */
  border: 1px solid ${props => (props.$isError ? '#f5c6cb' : '#c3e6cb')}; /* Borde sutil */
`;

const ReservationSummary = styled.div`
  background-color: #e9f5ff; /* Fondo azul claro para el resumen */
  border: 1px solid #b3d9ff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  h4 {
    color: #0056b3;
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.2em;
  }
  p {
    margin-bottom: 8px;
    color: #333;
    span {
      font-weight: bold;
      color: #000;
    }
  }
`;

const CountdownTimer = styled(Message)`
  color: #0056b3;
  background-color: #e0f2f7;
  border-color: #b2ebf2;
  margin-bottom: 25px;
  font-size: 1.2em;
  padding: 15px;
`;

const IconWrapper = styled.div`
  position: relative;
  input {
    padding-right: 40px; /* Espacio para el ícono */
  }
  img {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    height: 24px;
    width: auto;
  }
`;


const PaymentPage = () => {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ESTADOS PARA LA RESERVA Y EL TIEMPO RESTANTE ---
  const [reservation, setReservation] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  // --- FIN ESTADOS ---

  // Si no está autenticado, redirigir a login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // --- NUEVO useEffect PARA CARGAR LA RESERVA Y EL TIEMPO RESTANTE ---
  useEffect(() => {
    const fetchReservation = async () => {
      try {
        console.log('DEBUG: Intentando cargar reserva con ID:', reservationId);
        const res = await axiosInstance.get(`/reservations/${reservationId}`);
        // <-- CAMBIO AQUI: fetchedReservation es directamente res.data, no res.data.reservation
        const fetchedReservation = res.data; 
        console.log('DEBUG: Respuesta de la API de reserva:', fetchedReservation); // Verifica la respuesta completa
        if (!fetchedReservation) {
          setError('La reserva no fue encontrada o la respuesta está vacía.');
          setTimeLeft(0);
          return;
        }

        // <-- CAMBIO AQUI: Validación explícita de createdAt antes de usarla
        if (!fetchedReservation.createdAt) {
          setError('Error: La información de la reserva está incompleta: falta la fecha de creación.');
          setTimeLeft(0);
          console.error('La reserva cargada no tiene createdAt:', fetchedReservation); 
          return;
        }
        setReservation(fetchedReservation);

        // Calcular tiempo restante
        const createdAt = new Date(fetchedReservation.createdAt);
        const thirtyMinutes = 30 * 60 * 1000;
        const expirationTime = createdAt.getTime() + thirtyMinutes;
        const now = new Date().getTime();
        const remaining = expirationTime - now;

        if (fetchedReservation.status !== 'pending' || remaining <= 0) {
          setError('Esta reserva no está disponible para pago o ha expirado. Estado actual: ' + fetchedReservation.status);
          setTimeLeft(0); // Marcar como expirado
        } else {
          setTimeLeft(remaining);
          // Iniciar un contador regresivo
          const timer = setInterval(() => {
            setTimeLeft(prev => {
              if (prev <= 1000) { // Si queda 1 segundo o menos
                clearInterval(timer);
                setError('El tiempo para pagar esta reserva ha expirado.');
                return 0;
              }
              return prev - 1000;
            });
          }, 1000);
          return () => clearInterval(timer); // Limpiar el timer al desmontar
        }
      } catch (err) {
         // <-- CAMBIO AQUI: Manejo de error más robusto para axiosInstance
        const errorMessage = err.response?.data?.message || err.message || 'Error desconocido al cargar la reserva.';
        console.error('Error al cargar la reserva:', errorMessage, err);
        setError(`No se pudo cargar la información de la reserva: ${errorMessage}`);
        setTimeLeft(0); // Asegurar que el tiempo se ponga a 0 si hay un error de carga
      }
    };

    if (isAuthenticated && reservationId) {
      fetchReservation();
    }
  }, [isAuthenticated, reservationId, navigate]);

  // Función para formatear el tiempo
  const formatTime = (ms) => {
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  // --- FIN NUEVO useEffect Y FUNCIÓN ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // --- VALIDACIÓN DE TIEMPO Y ESTADO DE LA RESERVA (AHORA FUNCIONAL) ---
    // Asegurarse de que `reservation` no sea null antes de acceder a sus propiedades
    // y que `timeLeft` no sea null.
    if (!reservation || reservation.status !== 'pending' || timeLeft <= 0) {
        setError('No se puede procesar el pago. La reserva no está en estado pendiente o ha expirado.');
        setLoading(false); // Detener el loading si la validación falla
        return;
    }
    // --- FIN VALIDACIÓN DE TIEMPO Y ESTADO ---

    // Validaciones de tarjeta
    if (!cardNumber || !expiry || !cvv) {
      setError('Todos los campos de la tarjeta son obligatorios.');
      setLoading(false);
      return;
    }
    const onlyDigits = cardNumber.replace(/\s+/g, '');
    if (onlyDigits.length < 12) {
      setError('Número de tarjeta inválido. Debe tener al menos 12 dígitos.');
      setLoading(false);
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      setError('Fecha de expiración inválida (usar MM/AA, ej. 12/26).');
      setLoading(false);
      return;
    }
    if (!/^\d{3}$/.test(cvv)) {
      setError('CVV inválido (3 dígitos numéricos).');
      setLoading(false);
      return;
    }

    const paymentData = {
      cardNumber: onlyDigits,
      expiry,
      cvv,
      method: 'credit_card'
    };

    try {
      const resp = await payReservation(reservationId, paymentData); 
      console.log('Respuesta COMPLETA del backend (EXITO/PENDING):', resp); // 'resp' ya es la 'data'

      if (resp&& resp.message) {
        setSuccess(resp.message);
      } else {
        setSuccess('¡Pago procesado exitosamente! Redireccionando...');
      }
      
      console.log('DEBUG REDIRECCION: El objeto RESP es:', resp); // <--- LOG CLAVE: HAZ CLIC EN ESTE OBJETO EN LA CONSOLA
      console.log('DEBUG REDIRECCION: resp.status es', resp.status);  
      console.log('DEBUG REDIRECCION: resp.paymentInfo?.status es', resp.paymentInfo?.status); // <-- NUEVO LOG CLAVE
      // --- FIN DEBUGGING ---
      if (resp.paymentInfo?.status === 'approved') { 
        setTimeout(() => {
          navigate(`/payment-success/${resp.reservationId}`); // <-- Usar resp.reservationId para la URL
        }, 2000);
      } 
    } catch (err) {
      console.error('Error en PaymentPage (CATCH):', err.response?.data || err);
      const msg = err.response?.data?.message || 'Ocurrió un error inesperado al procesar el pago. Por favor, inténtalo de nuevo.';
      setError(msg);
      setSuccess(''); // Limpiar mensaje de éxito en caso de error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>Pagar Reserva</Title>

      {error && <Message $isError>{error}</Message>} 
      {success && <Message>{success}</Message>}

      {/* Mostrar el tiempo restante o el estado de la reserva */}
      {reservation && reservation.status === 'pending' && timeLeft !== null && timeLeft > 0 && (
        <Message style={{ color: '#007bff', marginBottom: '20px' }}>
          Tiempo restante para pagar: {formatTime(timeLeft)}
        </Message>
      )}
      {/*Mostrar mensaje cuando la reserva NO está pendiente o tiempo expiró*/}
      { (reservation && (reservation.status !== 'pending' || timeLeft <= 0)) ? (
        <>
          <Message $isError>
            No se puede procesar el pago. La reserva ya no está en estado pendiente o ha expirado.
          </Message>
          <SubmitButton onClick={() => navigate('/my-reservations')}>
            Ver mis reservas
          </SubmitButton>
        </>
      ) : (
        // Renderizar el formulario si la reserva es válida para pago
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <label htmlFor="cardNumber">Número de tarjeta</label>
            <input
              type="text"
              id="cardNumber"
              placeholder="Ej: 4111 1111 1111 1111"
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value)}
              maxLength={19}
            />
          </FormGroup>
          <FormGroup>
            <label htmlFor="expiry">Fecha de expiración (MM/AA)</label>
            <input
              type="text"
              id="expiry"
              placeholder="MM/AA"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              maxLength={5}
            />
          </FormGroup>
          <FormGroup>
            <label htmlFor="cvv">CVV</label>
            <input
              type="password"
              id="cvv"
              placeholder="123"
              value={cvv}
              onChange={e => setCvv(e.target.value)}
              maxLength={3}
            />
          </FormGroup>
          <SubmitButton
            type="submit"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Pagar'}
          </SubmitButton>
        </form>
      )}
    </Container>
  );
};

export default PaymentPage;