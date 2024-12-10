const axios = require('axios');

class InstagramService {
    constructor() {
        this.baseUrl = 'https://graph.instagram.com/v12.0';
    }

    async validateToken(accessToken) {
        try {
            const response = await axios.get(`${this.baseUrl}/me?fields=id,username&access_token=${accessToken}`);
            return response.data;
        } catch (error) {
            throw new Error('Geçersiz Instagram token');
        }
    }

    async getAccountInsights(accessToken) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/me/insights?metric=impressions,reach,profile_views&period=day&access_token=${accessToken}`
            );
            return response.data;
        } catch (error) {
            throw new Error('Instagram istatistikleri alınamadı');
        }
    }

    async getPosts(accessToken) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}`
            );
            return response.data.data;
        } catch (error) {
            throw new Error('Instagram gönderileri alınamadı');
        }
    }

    async checkAccountExists(username) {
        try {
            const response = await axios.get(`https://www.instagram.com/${username}/?__a=1`);
            return response.status === 200;
        } catch (error) {
            if (error.response?.status === 404) {
                return false;
            }
            throw error;
        }
    }

    async getPublicAccountInfo(username) {
        try {
            // Instagram'ın public API'sini kullan
            const response = await axios.get(`https://www.instagram.com/${username}/?__a=1`);
            const data = response.data.graphql.user;

            // Etkileşim oranını hesapla
            const engagementRate = this.calculateEngagementRate(
                data.edge_owner_to_timeline_media.edges,
                data.edge_followed_by.count
            );

            return {
                followers: data.edge_followed_by.count,
                following: data.edge_follow.count,
                posts_count: data.edge_owner_to_timeline_media.count,
                engagement_rate: engagementRate,
                is_private: data.is_private,
                is_verified: data.is_verified,
                biography: data.biography,
                external_url: data.external_url
            };
        } catch (error) {
            console.error('Instagram hesap bilgileri alınamadı:', error);
            throw new Error('Instagram hesap bilgileri alınamadı');
        }
    }

    calculateEngagementRate(posts, followers) {
        if (!posts.length || !followers) return 0;

        const totalEngagement = posts.reduce((sum, post) => {
            return sum + post.node.edge_liked_by.count + post.node.edge_media_to_comment.count;
        }, 0);

        return (totalEngagement / (posts.length * followers)) * 100;
    }
}

module.exports = new InstagramService(); 