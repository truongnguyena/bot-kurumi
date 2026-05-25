FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

RUN npm install --omit=dev --no-audit --no-fund \
  && npm cache clean --force

COPY . .

RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
ENV NODE_OPTIONS=--disable-warning=DEP0040
ENV PORT=8080

EXPOSE 8080

CMD ["./docker-entrypoint.sh"]
