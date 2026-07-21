# Dockerfile para Atlas Hub
FROM node:22-alpine

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* ./

# Instalar deps
RUN if [ -f package-lock.json ]; then npm ci --prefer-offline; else npm install --no-audit --no-fund; fi

# Copiar código (incluye .env.production con NEXT_PUBLIC_ vars)
COPY . .

# Cache bust — fuerza rebuild completo
RUN echo "Build $(date)" > /tmp/buildtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Build Next.js (lee .env.production automáticamente)
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
