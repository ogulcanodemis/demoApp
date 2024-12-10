const express = require('express');
const router = express.Router();
const reportingService = require('../services/reportingService');
const authMiddleware = require('../middleware/authMiddleware');

// Rapor oluştur
router.post('/accounts/:id/reports', authMiddleware, async (req, res) => {
    try {
        const { type = 'weekly' } = req.body;
        const report = await reportingService.generateReport(parseInt(req.params.id), type);
        res.json(report);
    } catch (error) {
        console.error('Rapor oluşturma hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Raporları listele
router.get('/accounts/:id/reports', authMiddleware, async (req, res) => {
    try {
        const reports = await db.getReportsByAccountId(parseInt(req.params.id));
        res.json(reports);
    } catch (error) {
        console.error('Rapor listeleme hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 