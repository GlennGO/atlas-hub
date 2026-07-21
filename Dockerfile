# Dockerfile para Atlas Hub
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* ./

# Instalar deps
RUN if [ -f package-lock.json ]; then npm ci --prefer-offline; else npm install --no-audit --no-fund; fi

# Copiar código (incluye .env.production con NEXT_PUBLIC vars)
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js con output: standalone
RUN npm run build

# --- Stage 2: producción ligera ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copiar standalone output (auto-generado por Next.js)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# public folder may be empty, create it as fallback
RUN mkdir -p ./public

EXPOSE 3000

CMD ["node", "server.js"]
