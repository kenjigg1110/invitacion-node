// src/notificar.js
// Envía notificaciones push al celular usando ntfy (https://ntfy.sh).
// ntfy es un servicio gratuito basado en HTTP: basta con hacer un POST a un
// "tema" y la app de ntfy en tu teléfono recibe el aviso al instante.

const SERVIDOR = (process.env.NTFY_SERVER || 'https://ntfy.sh').replace(/\/$/, '');

/**
 * Envía una notificación push.
 * @param {object} datos
 * @param {string} datos.titulo     Título que se ve en la notificación.
 * @param {string} datos.mensaje    Cuerpo del mensaje.
 * @param {string[]} [datos.etiquetas] Emojis/etiquetas de ntfy (ej. ["tada"]).
 * @param {number} [datos.prioridad]   1 (mínima) a 5 (urgente). Por defecto 3.
 * @returns {Promise<boolean>} true si ntfy aceptó el mensaje.
 */
async function enviarNotificacion({ titulo, mensaje, etiquetas = [], prioridad = 3 }) {
  const topic = process.env.NTFY_TOPIC;

  // Sin tema configurado la app sigue funcionando: solo avisa por consola.
  if (!topic) {
    console.warn('[notificar] NTFY_TOPIC no está configurado; no se envió la notificación.');
    return false;
  }

  try {
    // Publicamos con JSON (en lugar de cabeceras HTTP) para que acentos y
    // emojis viajen sin problemas.
    const respuesta = await fetch(SERVIDOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, title: titulo, message: mensaje, tags: etiquetas, priority: prioridad }),
      signal: AbortSignal.timeout(5000) // no esperamos más de 5 s
    });
    if (!respuesta.ok) console.error(`[notificar] ntfy respondió ${respuesta.status}`);
    return respuesta.ok;
  } catch (error) {
    console.error('[notificar] Error al enviar:', error.message);
    return false;
  }
}

module.exports = { enviarNotificacion };
