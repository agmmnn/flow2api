# Build stage
FROM oven/bun:1.3.14-slim AS build

WORKDIR /app
COPY package.json bun.lock ./
COPY apps/admin-web/package.json apps/admin-web/package.json
COPY apps/captcha-extension/package.json apps/captcha-extension/package.json
COPY apps/metadata-extension/package.json apps/metadata-extension/package.json
RUN bun install --frozen-lockfile
COPY apps/admin-web/ apps/admin-web/
RUN bun run --cwd apps/admin-web build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/apps/admin-web/dist /usr/share/nginx/html

# Copy custom nginx config
COPY apps/admin-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
