const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middleware/authMiddleware');
const publishService = require('../services/publishService');
const db = require('../database/db');

/**
 * @swagger
 * /calendar/events:
 *   get:
 *     summary: İçerik takvimi etkinliklerini listele
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Etkinlik listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/events', authMiddleware, calendarController.getEvents);

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - post_title
 *         - planned_date
 *       properties:
 *         id:
 *           type: integer
 *         post_title:
 *           type: string
 *         post_description:
 *           type: string
 *         planned_date:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [planned, published]
 */
router.post('/events', authMiddleware, calendarController.createEvent);
router.put('/events/:id', authMiddleware, calendarController.updateEvent);
router.delete('/events/:id', authMiddleware, calendarController.deleteEvent);

// İçerik analizi
router.get('/events/:id/analyze', authMiddleware, calendarController.analyzeEvent);
router.get('/events/suggestions', authMiddleware, calendarController.getContentSuggestions);

// Takvim istatistikleri
router.get('/stats', authMiddleware, calendarController.getCalendarStats);

router.get('/', authMiddleware, calendarController.getCalendar);
router.post('/', authMiddleware, calendarController.createEvent);
router.put('/:id', authMiddleware, calendarController.updateEvent);
router.delete('/:id', authMiddleware, calendarController.deleteEvent);
router.post('/generate', authMiddleware, calendarController.generateSchedule);

// Manuel paylaşım
router.post('/:id/publish', authMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const result = await publishService.publishNow(eventId, req.user.id);
        res.json({
            message: 'Gönderi başarıyla paylaşıldı',
            post: result
        });
    } catch (error) {
        console.error('Paylaşım hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Paylaşım durumunu kontrol et
router.get('/:id/status', authMiddleware, async (req, res) => {
    try {
        const event = await db.getCalendarEventById(parseInt(req.params.id));
        
        if (!event || event.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }

        res.json({
            status: event.status,
            error: event.error_message,
            published_at: event.published_at,
            instagram_post_id: event.instagram_post_id
        });
    } catch (error) {
        console.error('Durum kontrolü hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 