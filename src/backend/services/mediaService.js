const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');

class MediaService {
    constructor() {
        this.uploadDir = path.join(__dirname, '../../uploads');
        this.setupUploadDirectory();
    }

    async setupUploadDirectory() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
            await fs.mkdir(path.join(this.uploadDir, 'images'), { recursive: true });
            await fs.mkdir(path.join(this.uploadDir, 'videos'), { recursive: true });
            await fs.mkdir(path.join(this.uploadDir, 'thumbnails'), { recursive: true });
        } catch (error) {
            console.error('Upload dizini oluşturma hatası:', error);
        }
    }

    // Medya yükleme için multer konfigürasyonu
    getUploader() {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const type = file.mimetype.startsWith('image/') ? 'images' : 'videos';
                cb(null, path.join(this.uploadDir, type));
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        });

        return multer({
            storage,
            fileFilter: (req, file, cb) => {
                const allowedTypes = [
                    'image/jpeg', 'image/png', 'image/gif',
                    'video/mp4', 'video/quicktime'
                ];
                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Desteklenmeyen dosya türü'));
                }
            },
            limits: {
                fileSize: 50 * 1024 * 1024 // 50MB
            }
        });
    }

    // Resim işleme
    async processImage(filePath) {
        try {
            const image = sharp(filePath);
            const metadata = await image.metadata();

            // Instagram boyutlarına uygun hale getir
            if (metadata.width > 1080 || metadata.height > 1350) {
                await image
                    .resize(1080, 1350, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({ quality: 85 })
                    .toFile(filePath + '.processed.jpg');

                // Orijinal dosyayı sil
                await fs.unlink(filePath);
                // İşlenmiş dosyayı orijinal isimle yeniden adlandır
                await fs.rename(filePath + '.processed.jpg', filePath);
            }

            // Önizleme oluştur
            await image
                .resize(300, 300, {
                    fit: 'cover',
                    position: 'centre'
                })
                .jpeg({ quality: 70 })
                .toFile(path.join(this.uploadDir, 'thumbnails', path.basename(filePath)));

            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: metadata.size
            };
        } catch (error) {
            console.error('Resim işleme hatası:', error);
            throw error;
        }
    }

    // Video işleme
    async processVideo(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) return reject(err);

                const duration = metadata.format.duration;
                const { width, height } = metadata.streams[0];

                // Önizleme oluştur
                ffmpeg(filePath)
                    .screenshots({
                        timestamps: ['50%'],
                        filename: path.basename(filePath) + '.jpg',
                        folder: path.join(this.uploadDir, 'thumbnails'),
                        size: '300x300'
                    })
                    .on('end', () => {
                        resolve({
                            width,
                            height,
                            duration,
                            format: path.extname(filePath).slice(1)
                        });
                    })
                    .on('error', reject);
            });
        });
    }

    // Medya dosyasını sil
    async deleteMedia(filePath) {
        try {
            await fs.unlink(filePath);
            // Önizleme dosyasını da sil
            const thumbnailPath = path.join(
                this.uploadDir,
                'thumbnails',
                path.basename(filePath)
            );
            await fs.unlink(thumbnailPath).catch(() => {});
        } catch (error) {
            console.error('Medya silme hatası:', error);
            throw error;
        }
    }
}

module.exports = new MediaService(); 