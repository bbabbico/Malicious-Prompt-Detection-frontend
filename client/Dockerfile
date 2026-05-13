# Build stage
FROM node:20-slim AS build

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy package.json and pnpm-lock.yaml (if exists)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM nginx:stable-alpine

# Copy built files from build stage
# Based on client/vite.config.ts, the outDir is ../dist/public
COPY --from=build /dist/public /usr/share/nginx/html

# Copy nginx configuration if you have a custom one
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
