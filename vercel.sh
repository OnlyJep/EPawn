#!/bin/bash

# Vercel build script for Laravel + React

set -e

echo "=== Installing PHP ==="
# Download static PHP binary
curl -sL https://github.com/nickg/php-static/releases/download/v8.2.0/php-8.2.0-linux-x86_64.tar.gz -o php.tar.gz
tar xzf php.tar.gz
export PATH="$PWD:$PATH"
chmod +x php

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

echo "=== Creating storage directories ==="
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Cleanup
rm -f php.tar.gz php composer-setup.php
