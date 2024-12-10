const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middleware/authMiddleware');

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

module.exports = router; 