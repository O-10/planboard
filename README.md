# Planboard · Tableros de actividades

**Desarrollado por Oscar Iván Solarte Cerón** · [315 401 3707](tel:+573154013707)

🔗 **Demo en vivo:** <https://o-10.github.io/planboard/> — **Código:** <https://github.com/O-10/planboard>

Aplicación web inspirada en Trello para planificar actividades. Incluye tableros, listas, tarjetas con
arrastrar y soltar, estados de avance (**Planificada**, **En proceso**, **Ejecutada**) y etiquetas de
colores con nombre editable, igual que en Trello.

No necesita compilación ni dependencias: es HTML, CSS y JavaScript puro.

## Cómo ejecutarla

Con Node.js instalado:

```bash
cd tablero-actividades
npm start
```

Después abre <http://localhost:8088> en el navegador.

También puedes abrir `index.html` directamente, aunque algunos navegadores limitan el almacenamiento
local en archivos `file://`. Para que la persistencia funcione siempre, usa el servidor local.

> Si ves una versión antigua de la app, fuerza una recarga completa con `Ctrl + F5` (Windows/Linux) o
> `Cmd + Shift + R` (Mac). El servidor ya envía los archivos sin caché para evitarlo.

### Dos formas de guardar y compartir

| | Qué usa | Cuándo usarla |
| --- | --- | --- |
| **Nube (Firebase)** | Una base gratuita de Firebase | Quieres que funcione **aunque tu PC esté apagada** |
| **Tu SQL Server** | Tu SQL Server local + túnel de Cloudflare | Quieres que los datos queden **en tu computador** |

La app **detecta sola** cuál usar: si la abres servida por `local-server` (tu SQL Server), usa SQL Server;
si la abres desde GitHub Pages o `server.js`, usa Firebase (o solo el navegador si no configuras nada).

## Funcionalidades

- **Varios tableros** con fondo degradado, destacado con estrella, creación desde plantilla y opciones
  para duplicar, renombrar y eliminar.
- **Listas** para organizar el flujo: crear, renombrar (clic en el título o en el menú `⋯`), eliminar y
  reordenar arrastrando el asa `⠿`.
- **Tarjetas** con:
  - Título, descripción y fecha límite (con aviso de vencimiento).
  - Checklist con progreso.
  - Varias etiquetas de colores.
  - Estado de la actividad: Planificada, En proceso o Ejecutada. Pulsa la etiqueta de estado en la
    tarjeta para cambiarlo, o usa la leyenda lateral para filtrar por estado. El estado va ligado a la
    sección: al mover la actividad (arrastrando o desde el desplegable del detalle) a **En proceso** o
    **Ejecutadas**, el estado y el progreso se actualizan solos.
  - **Documentos adjuntos**: sube archivos con el botón *Adjuntar documento* o arrástralos y suéltalos
    sobre la zona de adjuntos del detalle.
  - Movimiento entre listas arrastrando o desde el desplegable del detalle.
- **Etiquetas estilo Trello**: 10 colores, nombre editable, reutilizables en todas las tarjetas del
  tablero y filtrables.
- **Filtros y búsqueda** por texto, etiqueta y estado.
- **Progreso del tablero**: barra superior con el avance ponderado: **Ejecutada** cuenta como 100 % y
  **En proceso** como 50 %. Mover una actividad a *En proceso* o *Ejecutadas* actualiza el porcentaje.
- **Edición directa en la tarjeta**: haz **doble clic** sobre el texto de una actividad (o pulsa el
  lápiz que aparece al pasar el ratón) para modificarlo ahí mismo, sin abrir el detalle. `Enter` guarda,
  `Esc` cancela y al hacer clic fuera también se guarda.
- **Persistencia automática** en `localStorage`, con exportación e importación de copias JSON.
- **Diseño responsive** con menú lateral desplegable en pantallas pequeñas.

## Uso rápido

1. Abre el tablero **Plan de actividades**, que viene con las secciones **vacías** (Ideas y pendientes,
   Planificadas, En proceso y Ejecutadas) listas para que las rellenes.
2. Pulsa **+ Añadir una tarjeta** en una sección para crear una actividad. Escribe el texto y pulsa
   **Añadir tarjeta** o simplemente `Enter` (`Shift`+`Enter` inserta un salto de línea). Lo que escribas
   se guarda en esa sección.
3. Para **modificar lo que escribiste**, haz doble clic sobre el texto de la tarjeta (o pulsa el lápiz)
   y edítalo directamente: `Enter` guarda, `Esc` cancela.
4. Haz clic en una tarjeta para abrir su detalle y asignar etiquetas, fecha, checklist, estado y
   documentos adjuntos. El título queda listo para escribir y **todo se guarda automáticamente**
   (verás la confirmación «Guardado ✓»).
5. Arrastra tarjetas entre listas para moverlas y usa **Filtros** para ver solo lo que necesitas.
6. Crea tus propias etiquetas desde el botón **Etiquetas** de la barra superior.

## Colaboración en línea (compartir el tablero)

Puedes compartir un tablero para que **otra persona lo vea y escriba en él desde otro lugar**, en tiempo
real. Se configura **una sola vez** con una base de datos gratuita de Firebase (sin tarjeta de crédito).

1. Entra en <https://console.firebase.google.com> con tu cuenta de Google y pulsa **Crear proyecto**.
   Ponle un nombre (por ejemplo `planboard`) y crea el proyecto (puedes desactivar Google Analytics).
2. En el menú lateral, abre **Compilación → Realtime Database** y pulsa **Crear base de datos**. Elige
   una ubicación y empieza en **modo de prueba**.
3. Abre la pestaña **Reglas**, pega esto y pulsa **Publicar**:

   ```json
   { "rules": { "boards": { ".read": true, ".write": true } } }
   ```

4. Ve a **Configuración del proyecto** (el engranaje) → **Tus apps** → icono **Web `</>`** → registra la
   app y copia el objeto de configuración (o solo la línea `databaseURL`).
5. En Planboard pulsa **Compartir**, pega ahí esa configuración y pulsa **Guardar y activar**.
6. Copia el enlace que aparece y envíalo por WhatsApp o correo. Quien lo abra verá **tus** actividades y
   podrá **redactar y editar** en ellas al instante. El enlace ya lleva la conexión incluida, así que tu
   compañero **no tiene que configurar nada**.

> **Privacidad:** con las reglas de arriba, cualquiera que tenga la URL de tu base de datos podría
> escribir en ella. El enlace compartido usa un identificador aleatorio largo (`#b=…`) que hace muy
> difícil adivinarlo; aun así, compártelo solo con las personas que deban editar el tablero. Puedes
> revocar el acceso cambiando las reglas o la base de datos cuando quieras.

Sin configurar Firebase, la app funciona igual pero guarda todo **solo en el navegador de cada persona**.

## Guardar en tu propio SQL Server (base principal, con túnel)

En este modo la app se sirve desde **tu computador** y guarda los tableros en **tu SQL Server**, sin
depender de la nube. Quien tenga el enlace entra por un **túnel de Cloudflare**, así que funciona aunque
tu compañero esté en otra parte de la ciudad.

**Requisitos:** SQL Server instalado y su servicio iniciado, Node.js y conexión a internet.

1. Abre una terminal en la carpeta del servidor:

   ```bash
   cd tablero-actividades/local-server
   npm install
   ```

2. Arranca todo con un solo paso:

   - **Doble clic en `start-planboard.bat`**, o
   - desde la terminal: `powershell -ExecutionPolicy Bypass -File start-planboard.ps1`

   El script, la primera vez, descarga `cloudflared.exe`, abre el túnel, muestra una **URL pública**
   (algo como `https://algo.trycloudflare.com`) y arranca el servidor en <http://localhost:8090>.

3. Abre <http://localhost:8090>, pulsa **Compartir** y copia el enlace que aparece. Envíalo a tu
   compañero: verá y editará el tablero **en tiempo real**, igual que con Firebase.

Si solo quieres probarlo en tu equipo (sin túnel), ejecuta `npm start` dentro de `local-server`, o usa
el script con la opción `-NoTunnel`.

**La base de datos** se crea sola al arrancar. Si prefieres crearla a mano:

```bash
cd local-server
sqlcmd -S localhost -E -C -i schema.sql
```

Guarda cada tablero en la tabla `Planboard.dbo.Boards` (`ShareId`, `Payload`, `UpdatedAt`), que puedes
consultar con SQL Server Management Studio.

> **Importante:** en este modo, tu computador debe estar **encendido y con la ventana abierta** para que
> tu compañero pueda entrar. El enlace gratuito de Cloudflare **cambia cada vez que reinicias**; si
> quieres un enlace fijo necesitas un dominio propio (túnel con nombre de Cloudflare). Y como en
> Firebase, **cualquiera que tenga el enlace puede editar** el tablero: compártelo solo con quien deba.

## Atajos

- `Esc`: cierra el modal, el menú o el panel de filtros abierto.
- `Enter` sobre una tarjeta enfocada: abre su detalle.
- `Enter` en el formulario de una tarjeta o lista: guarda.
- `Shift` + `Enter` en el compositor de tarjetas: inserta un salto de línea.
- `Enter` en el título del tablero: confirma el nombre.

## Estructura

| Archivo | Contenido |
| --- | --- |
| `index.html` | Estructura de la interfaz y modales |
| `styles.css` | Estilos, fondos, tarjetas, modales y responsive |
| `app.js` | Estado, persistencia, render, filtros, arrastrar/soltar y colaboración |
| `server.js` | Servidor local mínimo sin dependencias (solo estático) |
| `local-server/planboard-server.js` | Servidor con SQL Server (API + sincronización automática) |
| `local-server/schema.sql` | Creación de la base de datos y la tabla `Boards` |
| `local-server/start-planboard.bat` | Arranca el servidor + túnel de Cloudflare con doble clic |
| `local-server/start-planboard.ps1` | Script que descarga `cloudflared`, abre el túnel y arranca el servidor |

## Datos y respaldo

Por defecto todo se guarda en el navegador (`localStorage`). Si activas la **colaboración** (ver arriba),
el tablero compartido se sincroniza además con tu base de datos de Firebase. Y si usas el **servidor con
SQL Server**, el tablero activo se guarda directamente en tu SQL Server (tabla `Planboard.dbo.Boards`).
Usa **Exportar** en la barra lateral para descargar un `.json` con todos los tableros y **Importar** para
restaurarlo. **Reiniciar** deja el tablero de nuevo en blanco con sus secciones vacías.

Los cambios se guardan **automáticamente** al escribirlos (no hay botón "Guardar"). Si el navegador
bloquea el almacenamiento (modo privado, cookies bloqueadas o cuota llena), la app te avisa con un
mensaje y los cambios no se conservarán entre sesiones; en ese caso usa **Exportar** para no perderlos.

Los **documentos adjuntos** se guardan aparte, en el almacén `IndexedDB` del navegador (base
`planboard-files`), para no saturar `localStorage`. La copia JSON incluye únicamente los datos
descriptivos de cada documento (nombre, tipo, tamaño y fecha), **no su contenido**: al importar una
copia en otro navegador o equipo, los adjuntos aparecerán listados pero habrá que volver a subirlos.
El límite por archivo es de 15 MB.
