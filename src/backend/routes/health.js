const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/health', async (req, res) => {
    try {
        // Veritabanı bağlantısını kontrol et
        await new Promise((resolve, reject) => {
            db.get('SELECT 1', [], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

module.exports = router; 