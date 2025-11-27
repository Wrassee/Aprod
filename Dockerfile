# ============================================
# 1. FÁZIS: BUILDER
# ============================================
FROM node:20-slim AS builder
WORKDIR /app

# Rendszer függőségek
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Package files
COPY package.json package-lock.json ./

# Puppeteer skip
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Dependencies telepítése
RUN npm ci --legacy-peer-deps

# Forráskód másolása
COPY . .

# ============================================
# BUILD ARGUMENTUMOK
# ============================================
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG DATABASE_URL

# ⚠️ TÖRÖLD: VITE_APP_URL nem kell!
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=production

# 🔥 BUILD
RUN npm run build

# Production dependencies only
RUN npm prune --production --legacy-peer-deps

# ============================================
# 2. FÁZIS: PRODUCTION
# ============================================
FROM node:20-slim
WORKDIR /app

# Rendszer függőségek (Puppeteer, LibreOffice)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    libreoffice \
    default-jre-headless \
    && rm -rf /var/lib/apt/lists/*

# Package files
COPY package.json package-lock.json ./

# Builder stage-ből másolás
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config*.ts ./
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/public ./public

# Entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
RUN sed -i 's/\r$//' entrypoint.sh

# Temp könyvtár
RUN mkdir -p /app/temp && chmod 777 /app/temp

# Port
EXPOSE 10000

# ============================================
# RUNTIME ENV
# (Render automatikusan beállítja)
# ============================================
ENV NODE_ENV=production

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
CMD ["node", "dist/server/index.js"]