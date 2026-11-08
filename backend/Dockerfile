FROM node:22-bookworm-slim AS dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY backend/ ./
COPY database/migrations/ /app/database/migrations/
RUN npm run build

FROM node:22-bookworm-slim AS production-dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=production-dependencies --chown=node:node /app/backend/node_modules ./node_modules
COPY --from=build --chown=node:node /app/backend/package.json ./package.json
COPY --from=build --chown=node:node /app/backend/dist ./dist
COPY --from=build --chown=node:node /app/backend/dist-scripts ./dist-scripts
COPY --from=build --chown=node:node /app/database/migrations /app/database/migrations
USER node

EXPOSE 3000
CMD ["node", "dist/server.js"]
