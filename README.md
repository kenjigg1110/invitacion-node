# 💌 Invitación interactiva (Node.js)

Una página web para invitar a alguien a salir, hecha con **Node.js + Express**.
Tiene un pequeño juego: el botón **"No" escapa del puntero** (o del dedo en el celular) y nunca se deja presionar. Cuando la persona dice **Sí** y elige una cita (alitas de pollo, miche, chaska o café), el servidor te manda una **notificación push a tu celular** con lo que eligió.

## ¿Qué hace?

1. La persona abre el enlace y ve la pregunta "¿Quieres salir conmigo?".
2. El botón "No" huye por toda la pantalla cada vez que el puntero se acerca, lo toca o lo enfoca con el teclado.
3. Al pulsar "Sí" te llega una notificación (con el número de veces que intentó darle a "No").
4. Elige una cita y te llega otra notificación con su elección.

## Tecnologías

- **Node.js 18+** (usa `fetch` nativo y `AbortSignal.timeout`)
- **Express** para el servidor y la API
- **dotenv** para la configuración
- **ntfy.sh** (gratis, sin cuenta) para las notificaciones push
- HTML, CSS y JavaScript sin frameworks en el navegador

## Estructura

```
invitacion-node/
├── server.js                      # Servidor Express y API (/api/evento)
├── src/notificar.js               # Envío de notificaciones con ntfy
├── scripts/probar-notificacion.js # Envía una notificación de prueba
├── public/
│   ├── index.html                 # Las tres pantallas
│   ├── style.css                  # Estilos
│   └── app.js                     # Juego del botón que huye y llamadas a la API
├── .env.example                   # Ejemplo de configuración
└── package.json
```

## Instalación y ejecución

### 1. Instala las dependencias

```bash
npm install
```

### 2. Configura las notificaciones

1. Instala la app **ntfy** en tu celular (Android / iOS) o abre https://ntfy.sh/app.
2. Inventa un tema largo y difícil de adivinar, por ejemplo `invitacion-8f3k2-lupita-x9` y **suscríbete** a él desde la app.
3. Copia el archivo de ejemplo y pon tu tema:

```bash
cp .env.example .env
# edita .env y cambia NTFY_TOPIC por tu tema
```

4. Comprueba que funciona:

```bash
npm run probar
```

Deberías recibir "✅ Prueba de la invitación" en tu celular.

### 3. Arranca el servidor

```bash
npm start
```

Abre http://localhost:3000. Para desarrollo con recarga automática: `npm run dev`.

## Ejemplos de uso

**Enlace personalizado** con el nombre de la persona:

```
http://localhost:3000/?nombre=Ana
```

**Probar la API directamente:**

```bash
# Simula que dijo que sí
curl -X POST http://localhost:3000/api/evento \
  -H "Content-Type: application/json" \
  -d '{"tipo":"si","nombre":"Ana","intentos":7}'

# Simula que eligió café (opciones: alitas, miche, chaska, cafe)
curl -X POST http://localhost:3000/api/evento \
  -H "Content-Type: application/json" \
  -d '{"tipo":"cita","opcion":"cafe","nombre":"Ana"}'
```

Respuesta: `{"ok":true,"notificada":true}`

## Compartirlo con otra persona

`localhost` solo funciona en tu computadora. Para que otra persona lo abra desde su celular:

- **Rápido (para la demo):** un túnel como `npx localtunnel --port 3000` o [ngrok](https://ngrok.com), que te da un enlace público temporal.
- **Permanente:** súbelo a un hosting de Node.js (Render, Railway, Fly.io…) y define la variable de entorno `NTFY_TOPIC` en su panel (no subas tu `.env` a GitHub).

## Detalles de seguridad

- La API solo acepta las opciones de cita definidas en el servidor.
- Hay un límite de 20 eventos por IP cada 10 minutos para que nadie llene tu celular de avisos.
- El nombre se limpia en el servidor y se muestra con `textContent` en el navegador.
- `.env` está en `.gitignore`: tu tema de ntfy no se sube al repositorio.

## Licencia

MIT
