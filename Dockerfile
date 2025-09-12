# 1. FÁZIS: A "BUILDER" KÖRNYEZET
FROM node:20-slim AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential
COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm ci
COPY . .
RUN npm run build

# 2. FÁZIS: A VÉGLEGES, "PRODUCTION" KÖRNYEZET
FROM node:20-slim

WORKDIR /app

# --- MÓDOSÍTVA: A teljes 'libreoffice' csomagot telepítjük a maximális kompatibilitásért ---
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

COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
RUN mkdir /app/temp && chmod 777 /app/temp

EXPOSE 10000
CMD ["node", "dist/server/prod-server.js"]