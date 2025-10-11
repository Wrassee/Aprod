# 1. FÁZIS: A "BUILDER" KÖRNYEZET
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=TRUE
RUN npm ci

COPY . .

# --- DETEKTÍV 1: LÉTEZIK A MAPPA A BUILD ELŐTT? ---
RUN echo "### BUILDER STAGE: Listing files AFTER 'COPY . .' ###" && ls -l && echo "##################################################"
RUN test -d /app/shared && echo "✅ TEST PASSED: /app/shared folder EXISTS before build." || (echo "❌ TEST FAILED: /app/shared folder DOES NOT EXIST before build." && exit 1)

RUN npm run build

# --- DETEKTÍV 2: LÉTEZIK A MAPPA A BUILD UTÁN? ---
RUN echo "### BUILDER STAGE: Listing files AFTER 'npm run build' ###" && ls -l && echo "#####################################################"
RUN test -d /app/shared && echo "✅ TEST PASSED: /app/shared folder STILL EXISTS after build." || (echo "❌ TEST FAILED: /app/shared folder was DELETED during build." && exit 1)


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
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config*.ts ./
COPY --from=builder /app/migrations ./migrations

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

RUN mkdir /app/temp && chmod 777 /app/temp

EXPOSE 10000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/server/index.js"]