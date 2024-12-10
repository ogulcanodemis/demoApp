const express = require('express');
const router = express.Router();
const mediaService = require('../services/mediaService');
const authMiddleware = require('../middleware/authMiddleware');

// Medya yükleme
const upload = mediaService.getUploader();

router.post('/upload', authMiddleware, upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi' });
        }

        const isImage = req.file.mimetype.startsWith('image/');
        const metadata = isImage
            ? await mediaService.processImage(req.file.path)
            : await mediaService.processVideo(req.file.path);

        res.json({
            file: {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size
            },
            metadata,
            thumbnail: `/uploads/thumbnails/${req.file.filename}${isImage ? '' : '.jpg'}`
        });
    } catch (error) {
        console.error('Medya yükleme hatası:', error);
        if (req.file) {
            await mediaService.deleteMedia(req.file.path).catch(console.error);
        }
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:filename', authMiddleware, async (req, res) => {
    try {
        const filePath = path.join(mediaService.uploadDir, req.params.filename);
        await mediaService.deleteMedia(filePath);
        res.json({ message: 'Medya başarıyla silindi' });
    } catch (error) {
        console.error('Medya silme hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 