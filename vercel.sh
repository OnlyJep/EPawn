#!/bin/bash

# Vercel build script for Laravel + React

set -e

echo "=== Installing PHP ==="
# Download static PHP binary
curl -sL https://dl.static-php.dev/static-php-cli/bulk/php-8.2.32-cli-linux-x86_64.tar.gz -o php.tar.gz
tar xzf php.tar.gz
# Locate the PHP binary after extraction
PHP_DIR=""
for d in php-*/; do [ -d "$d" ] && PHP_DIR="$d" && break; done
if [ -n "$PHP_DIR" ] && [ -f "${PHP_DIR}bin/php" ]; then
  cp "${PHP_DIR}bin/php" ./php
fi
if [ ! -f ./php ]; then
  FOUND=$(find . -maxdepth 4 -name "php" -type f 2>/dev/null | head -1)
  [ -n "$FOUND" ] && cp "$FOUND" ./php
fi
chmod +x ./php
rm -f php.tar.gz
[ -n "$PHP_DIR" ] && rm -rf "$PHP_DIR"
export PATH="$PWD:$PATH"

echo "=== Installing Composer ==="
# Install Composer
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --quiet
php -r "unlink('composer-setup.php');"
chmod +x composer.phar
mv composer.phar php-composer

echo "=== Installing PHP dependencies ==="
php php-composer install --no-dev --optimize-autoloader --no-interaction

echo "=== Installing JS dependencies and compiling assets ==="
npm install --legacy-peer-deps
npm run production

echo "=== Generating APP_KEY ==="
php -r "file_put_contents('.vercel-app-key', 'base64:' . base64_encode(random_bytes(32)));"

echo "=== Creating storage directories ==="
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache

echo "=== Running database migrations ==="
php artisan migrate --force --no-interaction 2>/dev/null || echo "Migrations skipped (no DB connection)"

# Cleanup
rm -f php.tar.gz php composer-setup.php
