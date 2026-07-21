# Dockerfile para Atlas Hub
FROM node:22-alpine

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* ./

# Instalar deps
RUN if [ -f package-lock.json ]; then npm ci --prefer-offline; else npm install --no-audit --no-fund; fi

# Copiar código
COPY . .

# Crear .env.production con variables públicas (NEXT_PUBLIC_*)
# Estas variables son PÚBLICAS por diseño en Supabase (anon key, URL)
# Next.js las necesita durante el build para incrustarlas en el bundle del navegador
RUN echo "NEXT_PUBLIC_SUPABASE_URL=https://supa-atlas.glenngo.com" > .env.production && \
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NDU3MDg4MCwiZXhwIjo0OTQwMjQ0NDgwLCJyb2xlIjoiYW5vbiJ9.-TrnLOwbq6YRtc2woLS_aRFdmLqVyYjIPNbb7ApFL-M" >> .env.production

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Build Next.js (lee .env.production automáticamente)
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
