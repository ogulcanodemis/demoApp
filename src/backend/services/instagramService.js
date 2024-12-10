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

    async getCompetitorPosts(username) {
        try {
            const response = await axios.get(`https://www.instagram.com/${username}/?__a=1`);
            const posts = response.data.graphql.user.edge_owner_to_timeline_media.edges;

            return posts.map(post => ({
                id: post.node.id,
                shortcode: post.node.shortcode,
                caption: post.node.edge_media_to_caption.edges[0]?.node.text || '',
                type: post.node.is_video ? 'VIDEO' : 'IMAGE',
                url: post.node.display_url,
                thumbnail_url: post.node.thumbnail_src,
                likes: post.node.edge_liked_by.count,
                comments: post.node.edge_media_to_comment.count,
                timestamp: post.node.taken_at_timestamp * 1000,
                location: post.node.location?.name,
                hashtags: this.extractHashtags(post.node.edge_media_to_caption.edges[0]?.node.text || ''),
                mentions: this.extractMentions(post.node.edge_media_to_caption.edges[0]?.node.text || '')
            }));
        } catch (error) {
            console.error('Rakip gönderileri alınamadı:', error);
            throw new Error('Rakip gönderileri alınamadı');
        }
    }

    async getCompetitorAnalytics(username) {
        try {
            const [accountInfo, posts] = await Promise.all([
                this.getPublicAccountInfo(username),
                this.getCompetitorPosts(username)
            ]);

            // Post analizi
            const postAnalysis = this.analyzeCompetitorPosts(posts);

            // Hashtag analizi
            const hashtagAnalysis = this.analyzeHashtags(posts);

            // Zamanlama analizi
            const timingAnalysis = this.analyzePostingTimes(posts);

            return {
                account_info: accountInfo,
                post_analysis: postAnalysis,
                hashtag_analysis: hashtagAnalysis,
                timing_analysis: timingAnalysis,
                engagement_metrics: {
                    avg_likes: postAnalysis.avg_likes,
                    avg_comments: postAnalysis.avg_comments,
                    engagement_rate: accountInfo.engagement_rate,
                    engagement_trend: this.calculateEngagementTrend(posts)
                }
            };
        } catch (error) {
            console.error('Rakip analizi yapılamadı:', error);
            throw new Error('Rakip analizi yapılamadı');
        }
    }

    analyzeCompetitorPosts(posts) {
        const totalPosts = posts.length;
        if (!totalPosts) return null;

        const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
        const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);

        const contentTypes = posts.reduce((acc, post) => {
            acc[post.type] = (acc[post.type] || 0) + 1;
            return acc;
        }, {});

        const captionLengths = posts.map(post => post.caption.length);
        const avgCaptionLength = captionLengths.reduce((a, b) => a + b, 0) / totalPosts;

        return {
            total_posts: totalPosts,
            avg_likes: totalLikes / totalPosts,
            avg_comments: totalComments / totalPosts,
            content_type_distribution: contentTypes,
            avg_caption_length: avgCaptionLength,
            top_performing_posts: this.findTopPerformingPosts(posts)
        };
    }

    analyzeHashtags(posts) {
        const hashtags = {};
        posts.forEach(post => {
            post.hashtags.forEach(tag => {
                if (!hashtags[tag]) {
                    hashtags[tag] = {
                        count: 0,
                        total_engagement: 0,
                        posts: []
                    };
                }
                hashtags[tag].count++;
                hashtags[tag].total_engagement += post.likes + post.comments;
                hashtags[tag].posts.push(post.id);
            });
        });

        return Object.entries(hashtags)
            .map(([tag, data]) => ({
                tag,
                usage_count: data.count,
                avg_engagement: data.total_engagement / data.count,
                posts: data.posts
            }))
            .sort((a, b) => b.avg_engagement - a.avg_engagement);
    }

    analyzePostingTimes(posts) {
        const postsByHour = new Array(24).fill(0).map(() => ({
            count: 0,
            total_engagement: 0
        }));

        posts.forEach(post => {
            const hour = new Date(post.timestamp).getHours();
            postsByHour[hour].count++;
            postsByHour[hour].total_engagement += post.likes + post.comments;
        });

        return postsByHour.map((data, hour) => ({
            hour,
            post_count: data.count,
            avg_engagement: data.count ? data.total_engagement / data.count : 0
        }));
    }

    findTopPerformingPosts(posts, limit = 5) {
        return [...posts]
            .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
            .slice(0, limit);
    }

    extractHashtags(text) {
        return (text.match(/#[a-zA-Z0-9_]+/g) || [])
            .map(tag => tag.slice(1));
    }

    extractMentions(text) {
        return (text.match(/@[a-zA-Z0-9._]+/g) || [])
            .map(mention => mention.slice(1));
    }

    calculateEngagementTrend(posts) {
        if (posts.length < 2) return null;

        const sortedPosts = [...posts].sort((a, b) => b.timestamp - a.timestamp);
        const midPoint = Math.floor(posts.length / 2);

        const recentPosts = sortedPosts.slice(0, midPoint);
        const olderPosts = sortedPosts.slice(midPoint);

        const recentEngagement = recentPosts.reduce((sum, post) => sum + post.likes + post.comments, 0) / recentPosts.length;
        const olderEngagement = olderPosts.reduce((sum, post) => sum + post.likes + post.comments, 0) / olderPosts.length;

        const trend = ((recentEngagement - olderEngagement) / olderEngagement) * 100;

        return {
            percentage: trend,
            direction: trend > 0 ? 'up' : 'down',
            recent_avg: recentEngagement,
            older_avg: olderEngagement
        };
    }
}

module.exports = new InstagramService(); 