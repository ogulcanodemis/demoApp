const db = require('../database/db');
const instagramService = require('../services/instagramService');
const aiService = require('../services/aiService');

const instagramController = {
    getAccounts: async (req, res) => {
        try {
            const accounts = await db.getAccountsByUserId(req.user.id);
            res.json(accounts);
        } catch (error) {
            console.error('Hesaplar yüklenirken hata:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    },

    addAccount: async (req, res) => {
        try {
            const { account_name, access_token } = req.body;
            
            if (!account_name || !access_token) {
                return res.status(400).json({ 
                    error: 'Hesap adı ve access token gereklidir' 
                });
            }

            // Token'ı doğrula
            await instagramService.validateToken(access_token);

            const newAccount = await db.createAccount({
                user_id: req.user.id,
                account_name,
                access_token,
                is_competitor: false,
                followers: 0,
                engagement_rate: 0
            });

            res.status(201).json({
                id: newAccount.id,
                account_name,
                message: 'Hesap başarıyla eklendi'
            });
        } catch (error) {
            console.error('Hesap ekleme hatası:', error);
            res.status(500).json({ error: error.message });
        }
    },

    addCompetitor: async (req, res) => {
        try {
            const { username, profile_url } = req.body;
            
            if (!username || !profile_url) {
                return res.status(400).json({ 
                    error: 'Kullanıcı adı ve profil linki gereklidir' 
                });
            }

            // URL formatını kontrol et
            if (!profile_url.match(/^https?:\/\/(www\.)?instagram\.com\/[\w\d._]+\/?$/)) {
                return res.status(400).json({
                    error: 'Geçersiz Instagram profil linki'
                });
            }

            // Hesabın varlığını kontrol et
            const accountExists = await instagramService.checkAccountExists(username);
            if (!accountExists) {
                return res.status(404).json({
                    error: 'Instagram hesabı bulunamadı'
                });
            }

            // AI ile rakip analizi yap
            const analysis = await aiService.analyzeCompetitor(username);

            // Hesap bilgilerini al
            const accountInfo = await instagramService.getPublicAccountInfo(username);

            const newCompetitor = await db.createAccount({
                user_id: req.user.id,
                account_name: username,
                profile_url,
                is_competitor: true,
                followers: accountInfo.followers,
                following: accountInfo.following,
                posts_count: accountInfo.posts_count,
                engagement_rate: accountInfo.engagement_rate,
                analysis,
                last_analyzed: new Date().toISOString()
            });

            res.status(201).json({
                id: newCompetitor.id,
                username,
                analysis,
                account_info: accountInfo,
                message: 'Rakip başarıyla eklendi ve analiz edildi'
            });
        } catch (error) {
            console.error('Rakip ekleme hatası:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getAccountInsights: async (req, res) => {
        try {
            const accountId = parseInt(req.params.id);
            const account = await db.getAccountById(accountId);

            if (!account) {
                return res.status(404).json({ error: 'Hesap bulunamadı' });
            }

            if (account.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Bu hesaba erişim izniniz yok' });
            }

            // Test verileri (gerçek Instagram API entegrasyonu yerine)
            const mockData = {
                insights: {
                    impressions: Math.floor(Math.random() * 10000),
                    reach: Math.floor(Math.random() * 5000),
                    profile_views: Math.floor(Math.random() * 1000)
                },
                posts: [
                    {
                        id: '1',
                        caption: 'Test post #1',
                        media_url: 'https://picsum.photos/200',
                        like_count: Math.floor(Math.random() * 100),
                        comments_count: Math.floor(Math.random() * 20),
                        suggestedHashtags: '#marketing #socialmedia #instagram'
                    },
                    {
                        id: '2',
                        caption: 'Test post #2',
                        media_url: 'https://picsum.photos/200',
                        like_count: Math.floor(Math.random() * 100),
                        comments_count: Math.floor(Math.random() * 20),
                        suggestedHashtags: '#business #growth #success'
                    }
                ]
            };

            res.json(mockData);
        } catch (error) {
            console.error('İstatistik hatası:', error);
            res.status(500).json({ error: error.message });
        }
    },

    deleteAccount: async (req, res) => {
        try {
            const deleted = await db.deleteAccount(
                parseInt(req.params.id), 
                req.user.id
            );
            
            if (!deleted) {
                return res.status(404).json({ error: 'Hesap bulunamadı' });
            }
            
            res.json({ message: 'Hesap başarıyla silindi' });
        } catch (error) {
            console.error('Hesap silme hatası:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    },

    getCompetitorStats: async (req, res) => {
        try {
            const competitorId = parseInt(req.params.id);
            const competitor = await db.getAccountById(competitorId);

            if (!competitor) {
                return res.status(404).json({ error: 'Rakip bulunamadı' });
            }

            if (competitor.user_id !== req.user.id || !competitor.is_competitor) {
                return res.status(403).json({ error: 'Bu hesaba erişim izniniz yok' });
            }

            // Test verileri
            const mockStats = {
                followers: Math.floor(Math.random() * 50000),
                following: Math.floor(Math.random() * 1000),
                posts_count: Math.floor(Math.random() * 500),
                engagement_rate: (Math.random() * 5).toFixed(2),
                avg_likes: Math.floor(Math.random() * 1000),
                avg_comments: Math.floor(Math.random() * 50),
                posting_frequency: `${Math.floor(Math.random() * 7) + 1} posts/week`,
                top_hashtags: [
                    '#marketing',
                    '#socialmedia',
                    '#business',
                    '#entrepreneur',
                    '#success'
                ],
                content_analysis: {
                    photos: Math.floor(Math.random() * 100),
                    videos: Math.floor(Math.random() * 50),
                    carousels: Math.floor(Math.random() * 30)
                },
                best_posting_times: [
                    '10:00 AM',
                    '2:00 PM',
                    '7:00 PM'
                ],
                audience_demographics: {
                    age_groups: {
                        '18-24': Math.floor(Math.random() * 30),
                        '25-34': Math.floor(Math.random() * 40),
                        '35-44': Math.floor(Math.random() * 20),
                        '45+': Math.floor(Math.random() * 10)
                    },
                    gender: {
                        male: Math.floor(Math.random() * 60),
                        female: Math.floor(Math.random() * 40)
                    }
                }
            };

            res.json(mockStats);
        } catch (error) {
            console.error('Rakip istatistikleri hatası:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = instagramController; 