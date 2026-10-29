FROM node:24-bookworm-slim AS assets
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-fund
# npm ci can omit Rolldown's optional native binding on Linux; restore the matching version.
RUN node -e "require.resolve('@rolldown/binding-linux-x64-gnu')" \
    || npm install --no-save --no-package-lock @rolldown/binding-linux-x64-gnu@$(node -p "require('./node_modules/rolldown/package.json').version")
COPY vite.config.js ./
COPY resources ./resources
COPY public ./public
RUN npm run build

FROM dunglas/frankenphp:1-php8.5-trixie AS runtime
RUN install-php-extensions zip opcache
WORKDIR /app

FROM runtime AS dependencies
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction --prefer-dist
COPY . .
RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && composer dump-autoload --no-dev --classmap-authoritative --no-interaction

FROM runtime AS production
ENV APP_ENV=production APP_DEBUG=false LOG_CHANNEL=stderr SERVER_NAME=:8080
COPY --from=dependencies /app /app
COPY --from=assets /build/public/build /app/public/build
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY deploy/php.ini /usr/local/etc/php/conf.d/production.ini
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache /data /config \
    && setcap -r /usr/local/bin/frankenphp
USER www-data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD php -r 'exit(@file_get_contents("http://127.0.0.1:8080/health") === false ? 1 : 0);'
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
