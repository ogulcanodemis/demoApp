const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const authController = {
    register: async (req, res) => {
        try {
            const { username, email, password } = req.body;
            
            // Email kontrolü
            const existingUser = await db.getUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    error: 'Bu email zaten kullanımda'
                });
            }

            // Şifreyi hashle
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            // Yeni kullanıcı oluştur
            const newUser = await db.createUser({
                username,
                email,
                password: hashedPassword
            });

            // Token oluştur
            const token = jwt.sign(
                { id: newUser.id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.status(201).json({
                message: 'Kullanıcı başarıyla oluşturuldu',
                token
            });
        } catch (error) {
            console.error('Kayıt hatası:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            // Kullanıcıyı bul
            const user = await db.getUserByEmail(email);
            if (!user) {
                return res.status(400).json({
                    error: 'Kullanıcı bulunamadı'
                });
            }

            // Şifreyi kontrol et
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({
                    error: 'Geçersiz şifre'
                });
            }

            // Token oluştur
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.json({ token });
        } catch (error) {
            console.error('Giriş hatası:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    },

    getMe: async (req, res) => {
        try {
            const user = await db.getUserById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            }

            // Hassas bilgileri çıkar
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } catch (error) {
            console.error('Kullanıcı bilgileri hatası:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
};

module.exports = authController; 