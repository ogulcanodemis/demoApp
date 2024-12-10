const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/content-suggestions', authMiddleware, analysisController.getContentSuggestions);
router.get('/hashtag-suggestions', authMiddleware, analysisController.getHashtagSuggestions);
router.get('/best-posting-times', authMiddleware, analysisController.getBestPostingTimes);
router.get('/competitor-analysis', authMiddleware, analysisController.getCompetitorAnalysis);

module.exports = router; 