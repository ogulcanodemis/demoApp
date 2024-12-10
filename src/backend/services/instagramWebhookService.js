const axios = require('axios');
const db = require('../database/db');

class InstagramWebhookService {
    constructor() {
        this.baseUrl = 'https://graph.instagram.com/v12.0';
    }

    async handleWebhook(data) {
        try {
            const { object, entry } = data;
            
            if (object === 'instagram') {
                for (const item of entry) {
                    const { time, changes } = item;
                    
                    for (const change of changes) {
                        await this.processChange(change, time);
                    }
                }
            }
        } catch (error) {
            console.error('Webhook işleme hatası:', error);
            throw error;
        }
    }

    async processChange(change, timestamp) {
        const { field, value } = change;

        switch (field) {
            case 'followers':
                await this.updateFollowers(value);
                break;
            case 'media':
                await this.processNewMedia(value);
                break;
            case 'comments':
                await this.processNewComment(value);
                break;
            case 'stories':
                await this.processNewStory(value);
                break;
        }
    }

    async updateFollowers(data) {
        try {
            const { account_id, count } = data;
            const account = await db.getAccountByInstagramId(account_id);
            
            if (account) {
                await db.updateAccountStats(account.id, {
                    followers: count,
                    updated_at: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Takipçi güncelleme hatası:', error);
        }
    }

    async processNewMedia(data) {
        try {
            const { media_id, account_id } = data;
            const account = await db.getAccountByInstagramId(account_id);

            if (account) {
                // Media detaylarını al
                const mediaDetails = await this.getMediaDetails(media_id, account.access_token);
                
                // Veritabanına kaydet
                await db.createPost({
                    instagram_account_id: account.id,
                    post_id: media_id,
                    content_type: mediaDetails.media_type,
                    caption: mediaDetails.caption,
                    media_url: mediaDetails.media_url,
                    permalink: mediaDetails.permalink,
                    like_count: mediaDetails.like_count,
                    comments_count: mediaDetails.comments_count,
                    engagement_rate: this.calculateEngagementRate(
                        mediaDetails.like_count,
                        mediaDetails.comments_count,
                        account.followers
                    ),
                    posted_at: mediaDetails.timestamp,
                    created_at: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Yeni medya işleme hatası:', error);
        }
    }

    calculateEngagementRate(likes, comments, followers) {
        if (!followers) return 0;
        return ((likes + comments) / followers) * 100;
    }

    async getMediaDetails(mediaId, accessToken) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/${mediaId}`,
                {
                    params: {
                        fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
                        access_token: accessToken
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Medya detayları alınamadı:', error);
            throw error;
        }
    }
}

module.exports = new InstagramWebhookService(); 