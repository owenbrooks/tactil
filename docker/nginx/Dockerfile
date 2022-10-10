# Build bundle to be served by nginx
FROM node:lts-alpine3.16 as builder

# Install npm dependencies
ENV SOURCE_DIR=/tactil/ui
WORKDIR ${SOURCE_DIR}
COPY ui/package-lock.json ui/package.json ./
RUN npm ci --omit=dev && npm cache clean --force
# Copy source files
COPY ./ui ${SOURCE_DIR}
WORKDIR ${SOURCE_DIR}
RUN npm run build

# Serve using nginx
FROM nginx:stable as server
COPY --from=builder /tactil/ui/build /var/www/html/tactil
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf