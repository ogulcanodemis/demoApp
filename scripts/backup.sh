#!/bin/bash

# Değişkenleri yükle
source .env.production

# Backup dizini oluştur
BACKUP_DIR="backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# Veritabanını yedekle
sqlite3 $DB_PATH ".backup '$BACKUP_DIR/instagram_marketing.db'"

# Logları yedekle
cp -r logs/* $BACKUP_DIR/

# 7 günden eski yedekleri sil
find backups/* -type d -mtime +7 -exec rm -rf {} +

# Yedekleri sıkıştır
tar -czf "$BACKUP_DIR.tar.gz" $BACKUP_DIR
rm -rf $BACKUP_DIR

echo "Backup completed: $BACKUP_DIR.tar.gz" 