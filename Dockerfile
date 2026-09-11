FROM node:24-alpine AS build
RUN apk add --no-cache bash git
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run check

FROM nginx:1.30.4-alpine
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
ARG VCS_REF=local
LABEL org.opencontainers.image.revision=$VCS_REF
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx", "-g", "daemon off;"]
