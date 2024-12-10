const express = require('express');
const router = express.Router();
const statsService = require('../services/statsService');
const authMiddleware = require('../middleware/authMiddleware');

// Paylaşım istatistikleri
router.get('/publishing', authMiddleware, async (req, res) => {
    try {
        const { period } = req.query;
        const stats = await statsService.getPublishingStats(req.user.id, period);
        res.json(stats);
    } catch (error) {
        console.error('İstatistik hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Başarısız paylaşımlar
router.get('/failures', authMiddleware, async (req, res) => {
    try {
        const events = await db.getContentCalendar();
        const failedEvents = events
            .filter(event => 
                event.user_id === req.user.id && 
                event.status === 'failed'
            )
            .map(event => ({
                id: event.id,
                title: event.title,
                planned_date: event.planned_date,
                error_message: event.error_message,
                account_name: event.account_name
            }));

        res.json(failedEvents);
    } catch (error) {
        console.error('Başarısız paylaşım listesi hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 