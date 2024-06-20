FROM node:18-alpine as build
WORKDIR /app
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN ${SENTRY_AUTH_TOKEN}
COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.21-alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN find /usr/share/nginx/html -name "*.map" -type f -delete
COPY nginx-default.conf /etc/nginx/conf.d/default.conf