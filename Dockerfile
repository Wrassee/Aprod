# 1. FÁZIS: A "BUILDER" KÖRNYEZET
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG DATABASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build

RUN npm prune --production


# 2. FÁZIS: A VÉGLEGES, "PRODUCTION" KÖRNYEZET
FROM node:20-slim

WORKDIR /app

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

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/dist/shared ./dist/shared
COPY --from=builder /app/drizzle.config*.ts ./
COPY --from=builder /app/migrations ./migrations

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
RUN sed -i 's/\r$//' entrypoint.sh # <-- ITT A GARANTÁLT JAVÍTÁS

RUN mkdir /app/temp && chmod 777 /app/temp

EXPOSE 10000

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
CMD ["node", "dist/server/index.js"]