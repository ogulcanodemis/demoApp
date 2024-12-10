const express = require('express');
const router = express.Router();
const instagramWebhookService = require('../services/instagramWebhookService');

// Webhook doğrulama
router.get('/instagram', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
        res.send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Webhook olaylarını al
router.post('/instagram', async (req, res) => {
    try {
        await instagramWebhookService.handleWebhook(req.body);
        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook hatası:', error);
        res.sendStatus(500);
    }
});

module.exports = router; 