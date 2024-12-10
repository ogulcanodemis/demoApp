const nodemailer = require('nodemailer');
const path = require('path');
const ejs = require('ejs');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        this.templateDir = path.join(__dirname, '../templates/email');
    }

    async sendEmail(to, subject, template, data) {
        try {
            const html = await this.renderTemplate(template, data);
            
            await this.transporter.sendMail({
                from: `"Instagram AI Marketing" <${process.env.SMTP_FROM}>`,
                to,
                subject,
                html
            });

            console.log(`E-posta gönderildi: ${to}`);
        } catch (error) {
            console.error('E-posta gönderme hatası:', error);
            throw error;
        }
    }

    async renderTemplate(templateName, data) {
        try {
            const templatePath = path.join(this.templateDir, `${templateName}.ejs`);
            return await ejs.renderFile(templatePath, data);
        } catch (error) {
            console.error('Template render hatası:', error);
            throw error;
        }
    }

    // Paylaşım başarılı bildirimi
    async sendPublishSuccessNotification(user, post) {
        await this.sendEmail(
            user.email,
            'Paylaşımınız Başarıyla Yayınlandı',
            'publish-success',
            {
                user,
                post,
                viewUrl: `https://instagram.com/p/${post.instagram_post_id}`
            }
        );
    }

    // Paylaşım hatası bildirimi
    async sendPublishFailureNotification(user, post, error) {
        await this.sendEmail(
            user.email,
            'Paylaşım Hatası',
            'publish-failure',
            {
                user,
                post,
                error
            }
        );
    }

    // Günlük özet raporu
    async sendDailySummary(user, stats) {
        await this.sendEmail(
            user.email,
            'Günlük Instagram Performans Özeti',
            'daily-summary',
            {
                user,
                stats,
                date: new Date().toLocaleDateString('tr-TR')
            }
        );
    }

    // Haftalık performans raporu
    async sendWeeklyReport(user, stats) {
        await this.sendEmail(
            user.email,
            'Haftalık Instagram Performans Raporu',
            'weekly-report',
            {
                user,
                stats,
                weekStart: this.getWeekStartDate(),
                weekEnd: new Date().toLocaleDateString('tr-TR')
            }
        );
    }

    getWeekStartDate() {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date.toLocaleDateString('tr-TR');
    }
}

module.exports = new EmailService(); 