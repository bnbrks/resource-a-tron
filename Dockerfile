# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies with memory optimization
# Use --legacy-peer-deps to avoid memory issues with peer dependencies
RUN npm install --legacy-peer-deps --prefer-offline --no-audit

# Build frontend
FROM base AS frontend-builder
WORKDIR /app

# Copy root package.json and workspace structure
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Copy root node_modules from deps (workspace hoisting)
COPY --from=deps /app/node_modules ./node_modules

# Copy frontend source files
COPY frontend ./frontend

# Install frontend dependencies (this will create frontend/node_modules if needed)
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps --prefer-offline --no-audit || true

# Build frontend
RUN npm run build

# Build backend
FROM base AS backend-builder
WORKDIR /app

# Copy root package.json and workspace structure
COPY package*.json ./
COPY backend/package*.json ./backend/

# Copy root node_modules from deps (workspace hoisting)
COPY --from=deps /app/node_modules ./node_modules

# Copy backend source files
COPY backend ./backend

# Install backend dependencies (this will create backend/node_modules if needed)
WORKDIR /app/backend
RUN npm install --legacy-peer-deps --prefer-offline --no-audit || true

# Generate Prisma Client (already in node_modules, no global install needed)
RUN npx prisma generate

# Build TypeScript with increased memory limit
# Exit code 137 = out of memory, so we increase Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built applications
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Copy node_modules from deps (workspace hoisting puts everything at root)
COPY --from=deps /app/node_modules ./node_modules

# Prisma is already in node_modules, no need to install globally
# Use npx prisma for migrations if needed

# Expose port
EXPOSE 3000

# Start backend (frontend will be served by backend in production)
WORKDIR /app/backend
CMD ["node", "dist/index.js"]


