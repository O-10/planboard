# Planboard · Tableros de actividades

**Desarrollado por Oscar Iván Solarte Cerón** · [315 401 3707](tel:+573154013707)

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
| `app.js` | Estado, persistencia, render, filtros y arrastrar/soltar |
| `server.js` | Servidor local mínimo sin dependencias |

## Datos y respaldo

Todo se guarda en el navegador (`localStorage`), no en un servidor. Usa **Exportar** en la barra
lateral para descargar un `.json` con todos los tableros y **Importar** para restaurarlo. **Reiniciar**
deja el tablero de nuevo en blanco con sus secciones vacías.

Los cambios se guardan **automáticamente** al escribirlos (no hay botón "Guardar"). Si el navegador
bloquea el almacenamiento (modo privado, cookies bloqueadas o cuota llena), la app te avisa con un
mensaje y los cambios no se conservarán entre sesiones; en ese caso usa **Exportar** para no perderlos.

Los **documentos adjuntos** se guardan aparte, en el almacén `IndexedDB` del navegador (base
`planboard-files`), para no saturar `localStorage`. La copia JSON incluye únicamente los datos
descriptivos de cada documento (nombre, tipo, tamaño y fecha), **no su contenido**: al importar una
copia en otro navegador o equipo, los adjuntos aparecerán listados pero habrá que volver a subirlos.
El límite por archivo es de 15 MB.
