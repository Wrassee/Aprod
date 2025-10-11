# 1. FÁZIS: A "BUILDER" KÖRNYEZET
# Itt telepítünk mindent (dev és prod függőségeket is), és buildelünk.
FROM node:20-slim AS builder

WORKDIR /app

# A python3 és build-essential továbbra is kellhet a natív modulok fordításához
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Itt a `ci` telepíti az összes függőséget, ami a buildhez kell.
RUN npm ci

COPY . .
RUN npm run build

# --- HOZZÁADOTT OPTIMALIZÁCIÓS LÉPÉS ---
# A build után eltávolítjuk a felesleges fejlesztői csomagokat,
# hogy a `node_modules` mappa kisebb legyen.
RUN npm prune --production


# 2. FÁZIS: A VÉGLEGES, "PRODUCTION" KÖRNYEZET
# Ez egy tiszta lap, ahova csak a legszükségesebb dolgokat másoljuk át.
FROM node:20-slim

WORKDIR /app

# --- EZ A RÉSZ TOVÁBBRA IS LASSÚ MARAD ---
# A libreoffice telepítése a PDF generáláshoz szükséges, ez a leglassabb lépés.
# Ezen nem tudunk változtatni, ha a funkcióra szükség van.
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

# === JAVÍTÁS: NINCS TÖBBÉ npm ci! ===
# A `package.json` fájlokat csak azért másoljuk, hogy a futtató környezet tisztában legyen a projekt infóival.
COPY package.json package-lock.json ./

# Az előző fázisból átmásoljuk a már telepített és optimalizált `node_modules` mappát.
COPY --from=builder /app/node_modules ./node_modules

# Átmásoljuk a lefordított alkalmazást.
COPY --from=builder /app/dist ./dist

# Átmásoljuk a public mappát.
COPY --from=builder /app/public ./public

# Átmásoljuk a lefordított 'shared' mappát is a gyökérbe.
COPY --from=builder /app/dist/shared ./shared

# --- ÚJ LÉPÉSEK KEZDETE: AUTOMATIKUS MIGRÁCIÓ ---

# 1. Másoljuk be az entrypoint scriptet a konténerbe
COPY entrypoint.sh .

# 2. Tegyük futtathatóvá
RUN chmod +x entrypoint.sh

# --- ÚJ LÉPÉSEK VÉGE ---

# Temp könyvtár létrehozása feltöltésekhez
RUN mkdir /app/temp && chmod 777 /app/temp

EXPOSE 10000

# --- MÓDOSÍTOTT INDÍTÁSI PARANCS ---
# Az ENTRYPOINT fogja futtatni a scriptünket.
# A CMD pedig átadja a scriptnek az alapértelmezett parancsot (a szerver indítását).
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/server/index.js"]