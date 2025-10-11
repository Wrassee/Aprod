# 1. FÁZIS: A "BUILDER" KÖRNYEZET
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm ci

COPY . .

# --- HIBAKERESÉS 1: LÁTJUK A FÁJLOKAT A MÁSOLÁS UTÁN? ---
RUN echo "--- Listing files in BUILDER stage after 'COPY . .' ---" && ls -l

# --- HIBAKERESÉS 2: LÉTEZIK A MIGRATIONS MAPPA A BUILD ELŐTT? ---
# Ha itt hibát dob, akkor a 'migrations' mappa valamiért nem került be a build kontextusba.
RUN test -d /app/migrations && echo "✅ Migrations folder FOUND in builder stage before build" || (echo "❌ Migrations folder NOT FOUND in builder stage before build" && exit 1)


RUN npm run build
RUN npm prune --production


# 2. FÁZIS: A VÉGLEGES, "PRODUCTION" KÖRNYEZET
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    # ... (a hosszú apt-get lista változatlan)
    libreoffice \
    default-jre-headless \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist/shared ./shared
COPY --from=builder /app/drizzle.config*.ts ./
COPY --from=builder /app/migrations ./migrations
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh
RUN mkdir /app/temp && chmod 777 /app/temp

# --- HIBAKERESÉS 3: LÁTJUK A VÉGSŐ FÁJLOKAT? ---
RUN echo "--- Listing files in FINAL stage after all COPY commands ---" && ls -l

# --- HIBAKERESÉS 4: LÉTEZIK A MIGRATIONS MAPPA A VÉGSŐ IMAGE-BEN? ---
# Ha itt hibát dob, akkor a 'COPY --from=builder' parancs nem működött.
RUN test -d /app/migrations && echo "✅ Migrations folder FOUND in final image" || (echo "❌ Migrations folder NOT FOUND in final image" && exit 1)


EXPOSE 10000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/server/index.js"]