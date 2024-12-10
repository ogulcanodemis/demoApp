# Node.js base image
FROM node:20-alpine

# Çalışma dizinini oluştur
WORKDIR /app

# package.json ve package-lock.json'ı kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Veritabanını oluştur
RUN npm run create-db

# Port ayarı
EXPOSE 3000

# Uygulamayı başlat
CMD ["npm", "run", "dev"] 