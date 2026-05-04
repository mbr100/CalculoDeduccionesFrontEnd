# =============================================================================
# Calculadora IDI — Frontend Dockerfile
# Angular 20 / Node 20 Alpine → nginx Alpine
#
# Arquitectura: multi-stage build
#   Etapa 1 (builder): instala dependencias y ejecuta ng build --configuration production
#   Etapa 2 (runner):  imagen mínima nginx que sirve los estáticos resultantes
#
# Angular 20 con @angular/build:application genera los ficheros en:
#   dist/CalculoDeduccionesFrontEnd/browser/
#
# Compatible con x86_64 y ARM64 (Synology NAS)
# =============================================================================

# ── Etapa 1: Build de Angular ─────────────────────────────────────────────────
FROM node:20.19-alpine3.20 AS builder

WORKDIR /app

# Copiamos package.json y package-lock.json antes que el código fuente.
# Si no cambian, Docker reutiliza la capa de node_modules desde la caché.
COPY package.json package-lock.json ./

# npm ci (clean install) es más rápido y reproducible que npm install en CI/CD:
# instala exactamente las versiones del package-lock.json sin modificarlo.
RUN npm ci

# Ahora copiamos todo el código fuente
COPY . .

# Build de producción. La configuración "production" activa:
#   - tree-shaking y minificación
#   - hashing de ficheros para cache-busting
#   - environment de producción (environment.ts)
RUN npm run build

# ── Etapa 2: Servidor nginx ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Metadatos de la imagen
LABEL maintainer="mario.borrego100@gmail.com"
LABEL description="Calculadora IDI — Frontend Angular con nginx"
LABEL version="0.0.1"

# Eliminamos la configuración por defecto de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiamos nuestra configuración personalizada
COPY nginx.conf /etc/nginx/nginx.conf

# Copiamos los estáticos del build de Angular.
# El builder usa por defecto el nombre del proyecto definido en angular.json.
COPY --from=builder /app/dist/CalculoDeduccionesFrontEnd/browser/ /usr/share/nginx/html/

# Ajustamos permisos para que nginx (usuario 'nginx') pueda leer los ficheros
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# nginx escucha en el puerto 80
EXPOSE 80

# Healthcheck: comprueba que nginx responde
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

# nginx en foreground (daemon off) para que Docker pueda gestionar el proceso
CMD ["nginx", "-g", "daemon off;"]
