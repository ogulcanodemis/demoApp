const jwt = require('jsonwebtoken');
const db = require('../database/db');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Token bulunamadı' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await db.getUserById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ error: 'Geçersiz token' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Auth middleware hatası:', error);
        res.status(401).json({ error: 'Lütfen giriş yapın' });
    }
};

module.exports = authMiddleware; 