# syntax=docker/dockerfile:1

# --- Build: compile the client and the server ---------------------------------
FROM node:24-alpine AS build
WORKDIR /app

# Install first, from the manifests alone, so this layer is reused until a
# dependency changes.
COPY package.json package-lock.json ./
COPY packages/game-core/package.json packages/game-core/
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
RUN npm ci

COPY tsconfig.base.json ./
COPY packages packages
COPY apps apps
RUN npm run build

# --- Dependencies of the server only ------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/game-core/package.json packages/game-core/
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
RUN npm ci --omit=dev --workspace @rocket-odyssey/server

# --- Runtime: the image Railway runs -------------------------------------------
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

COPY --from=deps /app/node_modules node_modules
# The root manifest makes "npm start" work too, in case the platform starts the
# service with it instead of the CMD below.
COPY package.json ./
COPY apps/server/package.json apps/server/package.json
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/web/dist apps/web/dist

# Do not run as root.
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "apps/server/dist/index.js"]
