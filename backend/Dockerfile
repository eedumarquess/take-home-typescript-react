FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

FROM base AS tooling
RUN npm ci

COPY backend backend
COPY seed seed

RUN npx prisma generate --schema backend/prisma/schema.prisma
RUN npm run build --workspace backend

FROM base AS production-deps
RUN npm ci --omit=dev --workspace backend

COPY backend/prisma backend/prisma

RUN npx prisma generate --schema backend/prisma/schema.prisma

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=production-deps /app/node_modules node_modules
COPY --from=production-deps /app/package.json package.json
COPY --from=production-deps /app/package-lock.json package-lock.json
COPY --from=production-deps /app/backend/package.json backend/package.json
COPY --from=production-deps /app/backend/prisma backend/prisma
COPY --from=tooling /app/backend/dist backend/dist

EXPOSE 3001

CMD ["node", "backend/dist/main.js"]
