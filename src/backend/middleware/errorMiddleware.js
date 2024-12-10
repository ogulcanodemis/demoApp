const logger = require('../services/loggerService');

const errorHandler = (err, req, res, next) => {
    // Hatayı logla
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id
    });

    // Hata türüne göre yanıt ver
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Geçersiz veri formatı',
            details: err.details
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Yetkisiz erişim'
        });
    }

    if (err.name === 'NotFoundError') {
        return res.status(404).json({
            error: 'Kaynak bulunamadı'
        });
    }

    // Diğer hatalar için genel yanıt
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Bir hata oluştu' 
            : err.message
    });
};

module.exports = errorHandler; 