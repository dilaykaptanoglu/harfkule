# HarfKule API — Express + better-sqlite3 (Fly.io / Render / Railway)
FROM node:22-bookworm-slim
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=8787
ENV DATA_DIR=/data
RUN mkdir -p /data

EXPOSE 8787
VOLUME ["/data"]
CMD ["npx", "tsx", "src/index.ts"]
