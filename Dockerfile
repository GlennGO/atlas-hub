# Dockerfile simple para Atlas Hub - evitar multi-stage por ahora (diagnóstico)
FROM node:22-alpine

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* ./

# Instalar deps (npm install si no hay lock file, npm ci si lo hay)
RUN if [ -f package-lock.json ]; then npm ci --prefer-offline; else npm install --no-audit --no-fund; fi

# Copiar código
COPY . .

# Variables de entorno (build-time para NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build Next.js
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
