// public/app.js
// Lógica del navegador: pantallas, botón "No" que huye y aviso al servidor.

const $ = (selector) => document.querySelector(selector);

const pantallas = {
  pregunta: $('#pantalla-pregunta'),
  citas: $('#pantalla-citas'),
  final: $('#pantalla-final')
};
const btnSi = $('#btn-si');
const btnNo = $('#btn-no');
const hueco = $('#hueco');
const pista = $('#pista');
const estado = $('#estado');

// Personalización por enlace: https://tu-sitio/?nombre=Ana
// Usamos textContent (nunca innerHTML) para que el nombre no pueda inyectar HTML.
const nombre = (new URLSearchParams(location.search).get('nombre') || '').trim().slice(0, 30);
if (nombre) $('#titulo').textContent = `${nombre}, ¿quieres salir conmigo?`;

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** Muestra una pantalla y oculta las demás. */
function mostrar(nombrePantalla) {
  for (const [clave, el] of Object.entries(pantallas)) el.hidden = clave !== nombrePantalla;
}

/** Envía un evento al servidor, que se encarga de notificar a tu celular. */
async function enviarEvento(datos) {
  try {
    const respuesta = await fetch('/api/evento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, nombre })
    });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    return true;
  } catch (error) {
    estado.textContent = 'No se pudo enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo.';
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Juego: el botón "No" escapa del puntero                             */
/* ------------------------------------------------------------------ */

const DISTANCIA_PELIGRO = 110;   // px: si el puntero se acerca más, el botón huye
const DISTANCIA_MINIMA = 220;    // px: el nuevo escondite debe quedar al menos así de lejos
const MARGEN = 12;               // px de separación con el borde de la pantalla
const frases = [
  'No', '¿Segura?', 'Casi me alcanzas', 'Piénsalo bien', 'Ese botón está cansado',
  'Mejor di que sí', 'Ni lo sueñes', 'Rendirse es sano'
];

let intentos = 0;      // cuántas veces trataste de darle a "No"
let enFuga = false;    // true cuando el botón ya salió de su lugar original

/** Mueve el botón a un punto aleatorio lejos del puntero (px, py). */
function huir(px, py) {
  // La primera vez: reservamos su espacio y lo sacamos del flujo (position: fixed).
  if (!enFuga) {
    const caja = btnNo.getBoundingClientRect();
    hueco.style.display = 'inline-block';
    hueco.style.width = `${caja.width}px`;
    hueco.style.height = `${caja.height}px`;
    btnNo.style.width = `${caja.width}px`;
    btnNo.classList.add('huyendo');
    btnNo.style.left = `${caja.left}px`;
    btnNo.style.top = `${caja.top}px`;
    enFuga = true;
    // Forzamos un "reflow" para que la primera animación parta de su sitio real.
    void btnNo.offsetWidth;
  }

  const ancho = btnNo.offsetWidth;
  const alto = btnNo.offsetHeight;
  const maxX = Math.max(MARGEN, window.innerWidth - ancho - MARGEN);
  const maxY = Math.max(MARGEN, window.innerHeight - alto - MARGEN);

  // Probamos posiciones al azar hasta encontrar una suficientemente lejos del puntero.
  let x, y;
  for (let i = 0; i < 40; i++) {
    x = MARGEN + Math.random() * (maxX - MARGEN);
    y = MARGEN + Math.random() * (maxY - MARGEN);
    if (Math.hypot(x + ancho / 2 - px, y + alto / 2 - py) >= DISTANCIA_MINIMA) break;
  }
  btnNo.style.left = `${x}px`;
  btnNo.style.top = `${y}px`;

  intentos++;
  btnNo.textContent = frases[intentos % frases.length];
  pista.textContent = intentos === 1
    ? 'Uy, se movió.'
    : `Ya van ${intentos} intentos. El botón "Sí" está ahí, quietecito.`;
}

/** ¿El punto (px, py) está cerca del botón "No"? */
function estaCerca(px, py) {
  const c = btnNo.getBoundingClientRect();
  const dx = Math.max(c.left - px, 0, px - c.right);   // distancia horizontal al rectángulo
  const dy = Math.max(c.top - py, 0, py - c.bottom);   // distancia vertical al rectángulo
  return Math.hypot(dx, dy) < DISTANCIA_PELIGRO;
}

// Ratón y dedo: cada vez que el puntero se acerca (o toca), el botón escapa.
function alMoverPuntero(evento) {
  if (pantallas.pregunta.hidden) return;
  if (estaCerca(evento.clientX, evento.clientY)) huir(evento.clientX, evento.clientY);
}
document.addEventListener('pointermove', alMoverPuntero);
document.addEventListener('pointerdown', alMoverPuntero);

// Si logran clic o toque directo, lo cancelamos y huye igual.
btnNo.addEventListener('click', (e) => { e.preventDefault(); huir(e.clientX, e.clientY); });

// Teclado: al enfocar el botón con Tab también se escapa.
btnNo.addEventListener('focus', () => {
  const c = btnNo.getBoundingClientRect();
  huir(c.left + c.width / 2, c.top + c.height / 2);
  btnSi.focus(); // dejamos el foco en "Sí" para que Tab/Enter sigan siendo cómodos
});

// Si cambia el tamaño de la ventana, nos aseguramos de que el botón siga visible.
window.addEventListener('resize', () => {
  if (!enFuga) return;
  const c = btnNo.getBoundingClientRect();
  btnNo.style.left = `${Math.min(c.left, window.innerWidth - c.width - MARGEN)}px`;
  btnNo.style.top = `${Math.min(c.top, window.innerHeight - c.height - MARGEN)}px`;
});

/* ------------------------------------------------------------------ */
/* Flujo: "Sí" → elegir cita → confirmación                            */
/* ------------------------------------------------------------------ */

btnSi.addEventListener('click', () => {
  enviarEvento({ tipo: 'si', intentos }); // te avisa que dijo que sí
  mostrar('citas');
});

document.querySelectorAll('.opcion').forEach((boton) => {
  boton.addEventListener('click', async () => {
    // Evitamos dobles clics (y notificaciones repetidas).
    document.querySelectorAll('.opcion').forEach((b) => (b.disabled = true));
    estado.textContent = '';

    const ok = await enviarEvento({ tipo: 'cita', opcion: boton.dataset.opcion });
    if (!ok) {
      document.querySelectorAll('.opcion').forEach((b) => (b.disabled = false));
      return;
    }
    const nombreOpcion = boton.textContent.trim();
    $('#mensaje-final').textContent = `Ya me avisaron que elegiste ${nombreOpcion}. Te escribo para ponernos de acuerdo.`;
    mostrar('final');
  });
});
