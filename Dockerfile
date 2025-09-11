# 1. FÁZIS: A "BUILDER" KÖRNYEZET
# Itt rakjuk össze a webalkalmazásunkat.
FROM node:20-slim AS builder

WORKDIR /app

# Telepítjük a buildhez szükséges eszközöket
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential

# Csak a receptkönyveket másoljuk be a gyorsítótárazáshoz
COPY package.json package-lock.json ./

# Telepítjük az ÖSSZES függőséget
RUN npm ci

# Bemásoljuk a teljes forráskódot
COPY . .

# Lefuttatjuk a build parancsot
RUN npm run build


# 2. FÁZIS: A VÉGLEGES, "PRODUCTION" KÖRNYEZET
# Ez lesz a karcsú, gyors konténer, ami ténylegesen fut a Renderen.
FROM node:20-slim

WORKDIR /app

# Telepítjük a Puppeteer és a natív modulok futtatásához szükséges rendszerfüggőségeket
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
    && rm -rf /var/lib/apt/lists/*

# Bemásoljuk a receptkönyveket
COPY package.json package-lock.json ./

# CSAK a futtatáshoz szükséges függőségeket telepítjük
RUN npm ci --omit=dev

# Átmásoljuk a "builder" fázisban legenerált "dist" mappát
COPY --from=builder /app/dist ./dist

# --- JAVÍTÁS ITT: Bemásoljuk a hiányzó asset mappákat is ---
# A sablonok és a publikus fájlok (pl. logó) is kellenek a futtatáshoz.
COPY --from=builder /app/public ./public
COPY --from=builder /app/templates ./templates

# Megadjuk a portot, amin a szerver futni fog
EXPOSE 10000

# Parancs a szerver elindításához
CMD ["node", "dist/server/prod-server.js"]

