const instagramService = require('./instagramService');
const mediaService = require('./mediaService');
const db = require('../database/db');
const path = require('path');
const fs = require('fs').promises;
const emailService = require('./emailService');

class PublishService {
    constructor() {
        this.checkScheduledPosts();
    }

    // Zamanlanmış gönderileri kontrol et
    async checkScheduledPosts() {
        try {
            const now = new Date();
            const events = await db.getContentCalendar();
            
            const scheduledPosts = events.filter(event => {
                const postTime = new Date(event.planned_date);
                return event.status === 'planned' && 
                       postTime <= now && 
                       postTime >= new Date(now - 5 * 60 * 1000); // Son 5 dakika
            });

            for (const post of scheduledPosts) {
                await this.publishPost(post);
            }
        } catch (error) {
            console.error('Zamanlanmış gönderi kontrolü hatası:', error);
        } finally {
            // Her dakika kontrol et
            setTimeout(() => this.checkScheduledPosts(), 60 * 1000);
        }
    }

    // Gönderiyi paylaş
    async publishPost(post) {
        try {
            // Hesap bilgilerini al
            const account = await db.getAccountById(post.account_id);
            if (!account) {
                throw new Error('Hesap bulunamadı');
            }

            // Medya dosyasını kontrol et
            if (!post.media_path || !await this.checkMediaExists(post.media_path)) {
                throw new Error('Medya dosyası bulunamadı');
            }

            // Instagram'a yükle
            const result = await this.uploadToInstagram(post, account);

            // Başarılı paylaşımı kaydet
            await db.updateCalendarEvent(post.id, post.user_id, {
                status: 'published',
                instagram_post_id: result.id,
                published_at: new Date().toISOString()
            });

            // Başarı logu
            console.log(`Gönderi başarıyla paylaşıldı: ${post.id}`);
            
            // Başarılı paylaşım bildirimi
            const user = await db.getUserById(post.user_id);
            await emailService.sendPublishSuccessNotification(user, {
                ...post,
                instagram_post_id: result.id
            });

            return result;
        } catch (error) {
            console.error('Paylaşım hatası:', error);
            
            // Hatayı kaydet
            await db.updateCalendarEvent(post.id, post.user_id, {
                status: 'failed',
                error_message: error.message
            });
            
            // Hata bildirimi
            const user = await db.getUserById(post.user_id);
            await emailService.sendPublishFailureNotification(user, post, error);
            
            throw error;
        }
    }

    // Medya dosyasının varlığını kontrol et
    async checkMediaExists(mediaPath) {
        try {
            await fs.access(mediaPath);
            return true;
        } catch {
            return false;
        }
    }

    // Instagram'a yükle
    async uploadToInstagram(post, account) {
        const mediaType = path.extname(post.media_path).toLowerCase();
        const isVideo = ['.mp4', '.mov'].includes(mediaType);

        if (isVideo) {
            return await this.uploadVideo(post, account);
        } else {
            return await this.uploadImage(post, account);
        }
    }

    // Resim yükle
    async uploadImage(post, account) {
        try {
            const result = await instagramService.uploadPhoto({
                accessToken: account.access_token,
                imagePath: post.media_path,
                caption: this.formatCaption(post.caption, post.hashtags)
            });

            return result;
        } catch (error) {
            console.error('Resim yükleme hatası:', error);
            throw new Error('Resim Instagram\'a yüklenemedi');
        }
    }

    // Video yükle
    async uploadVideo(post, account) {
        try {
            const result = await instagramService.uploadVideo({
                accessToken: account.access_token,
                videoPath: post.media_path,
                caption: this.formatCaption(post.caption, post.hashtags)
            });

            return result;
        } catch (error) {
            console.error('Video yükleme hatası:', error);
            throw new Error('Video Instagram\'a yüklenemedi');
        }
    }

    // Caption formatla
    formatCaption(caption, hashtags) {
        let formattedCaption = caption || '';
        
        if (hashtags) {
            formattedCaption += '\n\n' + hashtags
                .split(' ')
                .filter(tag => tag.startsWith('#'))
                .join(' ');
        }
        
        return formattedCaption;
    }

    // Manuel paylaşım
    async publishNow(eventId, userId) {
        const event = await db.getCalendarEventById(eventId);
        
        if (!event || event.user_id !== userId) {
            throw new Error('Etkinlik bulunamadı');
        }

        if (event.status === 'published') {
            throw new Error('Bu gönderi zaten paylaşılmış');
        }

        return await this.publishPost(event);
    }
}

module.exports = new PublishService(); 