// backend/services/fakePaymentService.js

const processPayment = async (paymentData, amount) => {
  // Simula la lógica de una pasarela de pago externa.
  // En un entorno real, aquí se integrarían librerías como Stripe, Mercado Pago, etc.

  console.log(`[FAKE PAYMENT SERVICE] Procesando pago por ARS ${amount.toFixed(2)} con datos:`, paymentData);
  console.log(`[FAKE PAYMENT SERVICE] Card Number recibido: ${paymentData.cardNumber}`);
  
  // Extrae los últimos cuatro dígitos para la lógica de simulación
  const lastFourDigits = paymentData.cardNumber ? paymentData.cardNumber.slice(-4) : '';


  
  console.log(`[FAKE PAYMENT SERVICE] Termina en '0000'?: ${paymentData.cardNumber && paymentData.cardNumber.endsWith('0000')}`); // <-- NUEVO LOG
  console.log(`[FAKE PAYMENT SERVICE] Termina en '1111'?: ${paymentData.cardNumber && paymentData.cardNumber.endsWith('1111')}`); // <-- NUEVO LOG
  console.log(`[FAKE PAYMENT SERVICE] Termina en '2222' (Fondos Insuficientes)?: ${lastFourDigits === '2222'}`); // <-- NUEVO LOG
  console.log(`[FAKE PAYMENT SERVICE] Termina en '3333' (CVV Inválido)?: ${lastFourDigits === '3333'}`); // <-- NUEVO LOG

  // Lógica de simulación para diferentes escenarios de pago
  // Puedes usar valores específicos para simular aprobación/rechazo/pending.
  // Por ejemplo,si el número de tarjeta termina en '0000’: rechazar; si termina en '1111’: pendiente, si termina en '2222' :saldo insuficiente, si termina en '3333' :CVV invalido, cualquier otro numero ‘XXXX’ :aprobado

   // Simulate a delay to make it seem more realistic
  return new Promise(resolve => {
    setTimeout(() => {
      let result;

      if (lastFourDigits === '0000') {
        // Simula pago rechazado (genérico)
        result = {
          status: 'rejected',
          transactionId: `TXN-REJ-${Date.now()}`,
          message: 'Pago rechazado por el banco simulado.',
        };
      } else if (lastFourDigits === '1111') {
        // Simula pago pendiente
        result = {
          status: 'pending',
          transactionId: `TXN-PEND-${Date.now()}`,
          message: 'Pago pendiente de verificación.',
        };
      } else if (lastFourDigits === '2222') { // <-- NUEVA LÓGICA: Fondos Insuficientes
        result = {
          status: 'rejected', // Es un rechazo, pero con mensaje específico
          transactionId: `TXN-FUNDS-${Date.now()}`,
          message: 'Fondos insuficientes. Por favor, use otra tarjeta.',
        };
      } else if (lastFourDigits === '3333') { // <-- NUEVA LÓGICA: CVV Inválido
        result = {
          status: 'rejected', // Es un rechazo, pero con mensaje específico
          transactionId: `TXN-CVV-${Date.now()}`,
          message: 'Código de seguridad (CVV) inválido.',
        };
      } else {
        // Simula pago aprobado para cualquier otra combinación
        result = {
          status: 'approved',
          transactionId: `TXN-APR-${Date.now()}`,
          message: 'Pago aprobado exitosamente.',
        };
      }

      console.log(`[FAKE PAYMENT SERVICE] Resultado: ${result.status}, Mensaje: ${result.message}`);
      resolve(result);
    }, 1500); // Simulate a 1.5 second delay
  });
};


module.exports = {
  processPayment,
};