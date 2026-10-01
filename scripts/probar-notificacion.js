// scripts/probar-notificacion.js
// Uso: npm run probar
// Envía una notificación de prueba para comprobar que tu celular la recibe.

require('dotenv').config();
const { enviarNotificacion } = require('../src/notificar');

enviarNotificacion({
  titulo: '✅ Prueba de la invitación',
  mensaje: 'Si ves esto en tu celular, las notificaciones funcionan.',
  etiquetas: ['white_check_mark']
}).then((ok) => {
  console.log(ok ? 'Notificación enviada. Revisa tu celular.' : 'No se pudo enviar. Revisa tu .env.');
  process.exit(ok ? 0 : 1);
});
