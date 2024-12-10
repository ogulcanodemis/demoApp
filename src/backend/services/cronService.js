const cron = require('node-cron');
const db = require('../database/db');
const statsService = require('./statsService');
const emailService = require('./emailService');

class CronService {
    constructor() {
        // Her gün saat 09:00'da günlük özet gönder
        cron.schedule('0 9 * * *', () => this.sendDailySummaries());

        // Her Pazartesi saat 10:00'da haftalık rapor gönder
        cron.schedule('0 10 * * 1', () => this.sendWeeklyReports());
    }

    async sendDailySummaries() {
        try {
            const users = await db.getUsers();
            
            for (const user of users) {
                try {
                    const stats = await statsService.getPublishingStats(user.id, '1d');
                    await emailService.sendDailySummary(user, stats);
                } catch (error) {
                    console.error(`Günlük özet gönderilemedi: ${user.email}`, error);
                }
            }
        } catch (error) {
            console.error('Günlük özet gönderme hatası:', error);
        }
    }

    async sendWeeklyReports() {
        try {
            const users = await db.getUsers();
            
            for (const user of users) {
                try {
                    const stats = await statsService.getPublishingStats(user.id, '7d');
                    await emailService.sendWeeklyReport(user, stats);
                } catch (error) {
                    console.error(`Haftalık rapor gönderilemedi: ${user.email}`, error);
                }
            }
        } catch (error) {
            console.error('Haftalık rapor gönderme hatası:', error);
        }
    }
}

module.exports = new CronService(); 