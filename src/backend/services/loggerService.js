const winston = require('winston');
const path = require('path');

// Log formatını yapılandır
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Winston logger'ı oluştur
const logger = winston.createLogger({
    format: logFormat,
    transports: [
        // Hata logları için
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error'
        }),
        // Tüm loglar için
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log')
        })
    ]
});

// Geliştirme ortamında konsola da log bas
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger; 