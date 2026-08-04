# Estágio 1: build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY . .
RUN npm run build

# Estágio 2: runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Criar pasta de uploads persistente
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "./dist/server/entry.mjs"]
