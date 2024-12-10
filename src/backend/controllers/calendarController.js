const db = require('../database/db');
const aiService = require('../services/aiService');

const calendarController = {
    getCalendar: async (req, res) => {
        try {
            const events = await db.getContentCalendar(req.user.id);
            res.json(events);
        } catch (error) {
            console.error('Takvim yükleme hatası:', error);
            res.status(500).json({ error: error.message });
        }
    },

    createEvent: async (req, res) => {
        try {
            const { 
                title, 
                content_type, 
                planned_date, 
                caption, 
                hashtags,
                account_id 
            } = req.body;

            if (!title || !planned_date || !account_id) {
                return res.status(400).json({ 
                    error: 'Başlık, tarih ve hesap seçimi zorunludur' 
                });
            }

            // AI ile içerik önerisi al
            let aiSuggestions = null;
            if (content_type) {
                aiSuggestions = await aiService.generateContentSuggestions({
                    content_type,
                    caption: caption || title
                });
            }

            const newEvent = await db.createCalendarEvent({
                user_id: req.user.id,
                account_id,
                title,
                content_type,
                planned_date,
                caption,
                hashtags,
                status: 'planned',
                ai_suggestions: aiSuggestions
            });

            res.status(201).json(newEvent);
        } catch (error) {
            console.error('Etkinlik oluşturma hatası:', error);
            res.status(500).json({ error: error.message });
        }
    },

    updateEvent: async (req, res) => {
        try {
            const eventId = parseInt(req.params.id);
            const updates = req.body;

            const updatedEvent = await db.updateCalendarEvent(
                eventId,
                req.user.id,
                updates
            );

            if (!updatedEvent) {
                return res.status(404).json({ error: 'Etkinlik bulunamadı' });
            }

            res.json(updatedEvent);
        } catch (error) {
            console.error('Etkinlik güncelleme hatası:', error);
            res.status(500).json({ error: error.message });
        }
    },

    deleteEvent: async (req, res) => {
        try {
            const eventId = parseInt(req.params.id);
            const deleted = await db.deleteCalendarEvent(eventId, req.user.id);

            if (!deleted) {
                return res.status(404).json({ error: 'Etkinlik bulunamadı' });
            }

            res.json({ message: 'Etkinlik başarıyla silindi' });
        } catch (error) {
            console.error('Etkinlik silme hatası:', error);
            res.status(500).json({ error: error.message });
        }
    },

    generateSchedule: async (req, res) => {
        try {
            const { account_id, start_date, end_date } = req.body;

            if (!account_id || !start_date || !end_date) {
                return res.status(400).json({ 
                    error: 'Hesap ve tarih aralığı gereklidir' 
                });
            }

            // Hesap bilgilerini al
            const account = await db.getAccountById(account_id);
            if (!account || account.user_id !== req.user.id) {
                return res.status(404).json({ error: 'Hesap bulunamadı' });
            }

            // AI ile içerik planı oluştur
            const schedule = await aiService.generateContentSchedule({
                account_data: account,
                start_date,
                end_date
            });

            // Oluşturulan planı kaydet
            const savedEvents = await Promise.all(
                schedule.map(event => 
                    db.createCalendarEvent({
                        ...event,
                        user_id: req.user.id,
                        account_id,
                        status: 'planned'
                    })
                )
            );

            res.json(savedEvents);
        } catch (error) {
            console.error('Plan oluşturma hatası:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = calendarController; 