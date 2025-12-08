FROM node:20 AS base
WORKDIR /app
ARG DATABASE_PROVIDER=postgresql
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/assetdb
ENV DATABASE_PROVIDER=$DATABASE_PROVIDER
ENV DATABASE_URL=$DATABASE_URL
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install --legacy-peer-deps || true
COPY . .
RUN npm run prisma:generate && npm run build

EXPOSE 3000
CMD ["npm", "start"]