#!/bin/bash

# Vercel build script for Laravel + React

# Install PHP dependencies
composer install --no-dev --optimize-autoloader --no-interaction

# Install JS dependencies and compile assets
npm install --legacy-peer-deps
npm run production

# Create storage directories
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Set permissions
chmod -R 777 storage bootstrap/cache

# Create .env from Vercel environment variables
php -r "file_exists('.env') || copy('.env.example', '.env');"

# Generate app key if not set
php artisan key:generate --force --no-interaction 2>/dev/null || true
