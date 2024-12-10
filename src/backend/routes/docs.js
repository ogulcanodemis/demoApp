const express = require('express');
const router = express.Router();
const swaggerSpec = require('../config/swagger');

router.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

module.exports = router; 