# Etapa base para dependencias
FROM node:20-alpine AS base
WORKDIR /app
COPY api/package*.json ./

# Etapa de desarrollo
FROM base AS development
RUN npm install
COPY api/ ./
EXPOSE 8080
CMD ["npm", "run", "dev"]

# Etapa de construcción para producción
FROM base AS builder
RUN npm install
COPY api/ ./
RUN npm run build

# Etapa final de producción
FROM node:20-alpine AS production
WORKDIR /app
COPY api/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY db/ ./db
EXPOSE 8080
CMD ["node", "dist/index.js"]
