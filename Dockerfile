# Stage 1: Build
# 빌드 결과물(dist)은 플랫폼 무관한 정적 파일이므로, 빌드는 러너의 네이티브 플랫폼에서 1회만 수행한다.
# (멀티 아키 빌드 시 arm64 를 QEMU 로 npm ci / vite build 하지 않기 위함)
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG BUILD_MODE=production
RUN npm run build:${BUILD_MODE}

# Stage 2: Serve (대상 플랫폼 이미지)
FROM nginx:1.25-alpine
COPY ./nginx/admin.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html/
EXPOSE 3200
ENTRYPOINT ["nginx", "-g", "daemon off;"]
