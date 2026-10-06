FROM node:22-slim AS build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
ARG API_PROXY_TARGET=http://host.docker.internal:8080
ENV API_PROXY_TARGET=${API_PROXY_TARGET}
RUN npm run build

FROM node:22-slim
WORKDIR /app/web
ENV NODE_ENV=production
COPY --from=build /app/web/package.json /app/web/package-lock.json ./
COPY --from=build /app/web/node_modules ./node_modules
COPY --from=build /app/web/.next ./.next
COPY --from=build /app/web/public ./public
COPY --from=build /app/web/next.config.mjs ./next.config.mjs
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]