#!/bin/bash

# Değişkenleri yükle
source .env.production

# Git'ten son değişiklikleri al
git pull origin main

# Bağımlılıkları yükle
npm install

# Tailwind CSS'i build et
npm run build:css

# Docker imajlarını build et
docker-compose build

# Eski container'ları durdur ve kaldır
docker-compose down

# Yeni container'ları başlat
docker-compose up -d

# Veritabanı migration'larını çalıştır
docker-compose exec app npm run migrate

# Logları kontrol et
docker-compose logs -f 