const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/accounts/:id/metrics', authMiddleware, async (req, res) => {
    try {
        const metrics = await analyticsService.calculateMetrics(parseInt(req.params.id));
        res.json(metrics);
    } catch (error) {
        console.error('Analiz hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 