# syntax=docker/dockerfile:1

# --- Builder Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Vite app
RUN npm run build

# --- Production Stage ---
# nginx serves the static bundle and reverse proxies /api, /auth and /ws to the
# backend, so the whole app is reachable through a single origin and the browser
# never makes a cross-origin request.
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# The nginx entrypoint expands templates/*.template with envsubst before start.
# The filter keeps it from touching nginx's own $variables.
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
ENV NGINX_ENVSUBST_FILTER="^BACKEND_"
ENV BACKEND_ORIGIN="http://backend:8080"

# Script that injects environment variables into env.js
COPY runtime-env.sh /docker-entrypoint.d/10-runtime-env.sh
RUN chmod +x /docker-entrypoint.d/10-runtime-env.sh

EXPOSE 8080
