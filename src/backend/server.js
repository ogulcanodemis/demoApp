require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const instagramRoutes = require('./routes/instagram');
const webhookRoutes = require('./routes/webhook');
const analyticsRoutes = require('./routes/analytics');
const reportingRoutes = require('./routes/reporting');

// Global hata yakalama
process.on('uncaughtException', (error) => {
    console.error('Yakalanmamış hata:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('İşlenmemiş promise reddi:', error);
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Statik dosyalar için
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reporting', reportingRoutes);

// Webhook Routes
app.use('/webhook', webhookRoutes);

// Frontend Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
    console.error('Hata:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 