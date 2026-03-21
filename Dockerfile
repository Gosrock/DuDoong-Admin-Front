# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG BUILD_MODE=production
RUN npm run build:${BUILD_MODE}

# Stage 2: Serve
FROM nginx:1.25-alpine
COPY ./nginx/admin.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html/
EXPOSE 3200
ENTRYPOINT ["nginx", "-g", "daemon off;"]
