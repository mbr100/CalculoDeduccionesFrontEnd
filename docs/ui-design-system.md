# Sistema de diseno UI

## Referencia visual

La referencia principal para tablas y superficies es la pestaña `RNTs` (`bases-cotizacion-personal`), no la de `Retribuciones`.

Ese patron se convierte en el estandar para:

- Tablas de mantenimiento y listados
- Formularios embebidos
- Modales de insercion/edicion
- Botoneria principal y secundaria

## Principios

1. La informacion debe vivir en superficies claras, blancas y con borde suave.
2. La jerarquia se marca con espaciado, cabeceras limpias y colores de apoyo, no con sombras pesadas.
3. Los formularios deben sentirse igual en toda la app: mismas alturas, radios, foco y mensajes.
4. Los modales deben dejar ver el contexto de fondo con overlay translucido y blur suave.
5. Las tablas deben priorizar legibilidad: cabecera compacta, hover discreto, alineacion numerica y acciones contenidas.

## Patrones base

### Pagina

- Fondo general claro `slate`
- Cabecera dentro de tarjeta
- Titulo + subtitulo + acciones en la misma banda

### Botones

- `ui-btn ui-btn-primary`: accion principal de navegacion o actualizacion
- `ui-btn ui-btn-success`: alta, guardar, confirmar
- `ui-btn ui-btn-secondary`: volver, cancelar, filtros auxiliares
- `ui-btn-icon`: acciones de fila

### Formularios

- Etiquetas consistentes con `ui-label`
- Inputs/selects/textarea con `ui-input`, `ui-select`, `ui-textarea`
- Checkboxes dentro de tarjetas `ui-checkbox-card`
- Acciones alineadas a la derecha con `ui-form-actions`

### Tablas

- Contenedor `ui-table-shell`
- Tabla `ui-table`
- Estados vacios o cargando con bloques centrados
- Filas con hover suave
- Columnas numericas alineadas a la derecha

### Modales

- Overlay `ui-modal-backdrop`
- Panel `ui-modal-panel`
- Cabecera separada visualmente
- Scroll interno si el contenido crece

## Implementacion

La capa compartida vive en `src/styles.css`.

Clases disponibles:

- `ui-page`
- `ui-page-header`
- `ui-title-block`
- `ui-title-icon`
- `ui-page-title`
- `ui-page-subtitle`
- `ui-toolbar`
- `ui-note`
- `ui-panel`
- `ui-form`
- `ui-form-grid`
- `ui-form-grid-compact`
- `ui-field`
- `ui-label`
- `ui-help`
- `ui-form-error`
- `ui-input`
- `ui-select`
- `ui-select-sm`
- `ui-textarea`
- `ui-checkbox`
- `ui-checkbox-card`
- `ui-form-actions`
- `ui-btn`
- `ui-btn-secondary`
- `ui-btn-primary`
- `ui-btn-success`
- `ui-btn-danger`
- `ui-btn-icon`
- `ui-table-shell`
- `ui-table-wrap`
- `ui-table`
- `ui-pill`
- `ui-pill-neutral`
- `ui-pill-success`
- `ui-pill-danger`
- `ui-modal-backdrop`
- `ui-modal-layout`
- `ui-modal-panel`
- `ui-banner-error`

## Alcance aplicado en esta iteracion

- Mantenimientos:
  - `configuracion-anual-ss`
  - `tarifa-primas-cnae`
  - `claves-ocupacion`
- Formularios/modales:
  - alta/edicion de personal
  - nuevo economico

## Regla de futuro

Cuando se cree una nueva pantalla con insercion de datos, debe arrancar reutilizando estas clases antes de introducir estilos locales.
