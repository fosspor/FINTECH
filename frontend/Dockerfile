FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN set -e; \
    npm config set fund false; \
    npm config set audit false; \
    npm config set fetch-retries 5; \
    npm config set fetch-retry-mintimeout 20000; \
    npm config set fetch-retry-maxtimeout 120000; \
    for i in 1 2 3; do \
      npm ci --no-audit --no-fund && exit 0; \
      echo "npm ci failed (attempt $i), retrying..." >&2; \
      sleep 5; \
    done; \
    exit 1
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
