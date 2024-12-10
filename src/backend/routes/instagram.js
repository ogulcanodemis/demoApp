const express = require('express');
const router = express.Router();
const instagramController = require('../controllers/instagramController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * /instagram/accounts:
 *   get:
 *     summary: Instagram hesaplarını listele
 *     tags: [Instagram]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instagram hesapları listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   account_name:
 *                     type: string
 *                   is_competitor:
 *                     type: boolean
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/accounts', authMiddleware, instagramController.getAccounts);
router.post('/accounts', authMiddleware, instagramController.addAccount);
router.delete('/accounts/:id', authMiddleware, instagramController.deleteAccount);

// Hesap istatistikleri
router.get('/accounts/:id/insights', authMiddleware, instagramController.getAccountInsights);

// Rakip analizi
router.post('/competitors', authMiddleware, instagramController.addCompetitor);
router.get('/competitors/:id/stats', authMiddleware, instagramController.getCompetitorStats);

// İçerik önerileri
router.get('/accounts/:id/content-suggestions', authMiddleware, instagramController.getContentSuggestions);
router.post('/hashtag-recommendations', authMiddleware, instagramController.getHashtagRecommendations);

module.exports = router; 