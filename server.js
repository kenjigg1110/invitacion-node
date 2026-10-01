// server.js
// Servidor Express: sirve la página (carpeta /public) y expone una pequeña API
// que recibe lo que hace la persona invitada y te lo manda como notificación.

require('dotenv').config();
const express = require('express');
const path = require('path');
const { enviarNotificacion } = require('./src/notificar');

const app = express();
const PORT = process.env.PORT || 3000;

// Opciones de cita permitidas. La clave es lo que manda el navegador;
// cualquier otra cosa se rechaza (nunca confiamos en lo que llega del cliente).
const CITAS = {
  alitas: { nombre: 'Alitas de pollo', emoji: '🍗' },
  miche:  { nombre: 'Miche',           emoji: '🍺' },
  chaska: { nombre: 'Chaska',          emoji: '🥤' },
  cafe:   { nombre: 'Café',            emoji: '☕' }
};

// --- Middlewares ---------------------------------------------------------
app.disable('x-powered-by');
app.use(express.json({ limit: '2kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Límite sencillo por IP (en memoria): máx. 20 eventos cada 10 minutos.
// Evita que alguien llene tu celular de notificaciones.
const historial = new Map();
function limitar(req, res, next) {
  const ahora = Date.now();
  const ventana = 10 * 60 * 1000;
  const recientes = (historial.get(req.ip) || []).filter((t) => ahora - t < ventana);
  if (recientes.length >= 20) return res.status(429).json({ ok: false, error: 'Demasiados intentos' });
  recientes.push(ahora);
  historial.set(req.ip, recientes);
  next();
}

// Limpia el nombre: sin caracteres de control y máximo 30 letras.
const limpiarNombre = (texto) =>
  String(texto || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 30);

// --- Rutas ---------------------------------------------------------------

// Comprobación rápida de que el servidor vive.
app.get('/api/salud', (req, res) => res.json({ ok: true }));

// Recibe un evento del navegador:
//   { tipo: "si",   nombre?, intentos? }  -> aceptó la invitación
//   { tipo: "cita", opcion,  nombre? }    -> eligió una cita
app.post('/api/evento', limitar, async (req, res) => {
  const { tipo, opcion } = req.body || {};
  const nombre = limpiarNombre(req.body && req.body.nombre) || 'Tu invitada';
  const intentos = Math.min(Math.max(parseInt(req.body && req.body.intentos, 10) || 0, 0), 9999);

  let aviso;
  if (tipo === 'si') {
    aviso = {
      titulo: '🎉 ¡Dijo que SÍ!',
      mensaje: `${nombre} aceptó la invitación. Intentó darle a "No" ${intentos} ${intentos === 1 ? 'vez' : 'veces'}.`,
      etiquetas: ['tada'],
      prioridad: 4
    };
  } else if (tipo === 'cita' && CITAS[opcion]) {
    const cita = CITAS[opcion];
    aviso = {
      titulo: `${cita.emoji} Eligió: ${cita.nombre}`,
      mensaje: `${nombre} escogió "${cita.nombre}" para la cita.`,
      etiquetas: ['heart'],
      prioridad: 5
    };
  } else {
    return res.status(400).json({ ok: false, error: 'Evento no válido' });
  }

  const notificada = await enviarNotificacion(aviso);
  console.log(`[evento] ${tipo}${opcion ? ' → ' + opcion : ''} (notificada: ${notificada})`);
  res.json({ ok: true, notificada });
});

// --- Arranque ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
  if (!process.env.NTFY_TOPIC) console.warn('Aviso: define NTFY_TOPIC en .env para recibir notificaciones.');
});
