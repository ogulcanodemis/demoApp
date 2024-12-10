const db = require('../database/db');

class AnalyticsService {
    async calculateMetrics(accountId) {
        try {
            const account = await db.getAccountById(accountId);
            const posts = await db.getPostsByAccountId(accountId);
            
            // Son 30 günlük veriler
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentPosts = posts.filter(post => 
                new Date(post.posted_at) > thirtyDaysAgo
            );

            return {
                account_metrics: {
                    total_followers: account.followers,
                    total_posts: posts.length,
                    avg_engagement_rate: this.calculateAvgEngagementRate(posts),
                    posting_frequency: this.calculatePostingFrequency(posts),
                    best_posting_time: this.findBestPostingTime(posts)
                },
                recent_performance: {
                    posts_count: recentPosts.length,
                    total_likes: this.sumMetric(recentPosts, 'like_count'),
                    total_comments: this.sumMetric(recentPosts, 'comments_count'),
                    avg_likes_per_post: this.avgMetric(recentPosts, 'like_count'),
                    avg_comments_per_post: this.avgMetric(recentPosts, 'comments_count'),
                    engagement_trend: this.calculateEngagementTrend(recentPosts)
                },
                content_analysis: {
                    top_performing_posts: this.findTopPosts(posts, 5),
                    content_type_distribution: this.analyzeContentTypes(posts),
                    hashtag_performance: this.analyzeHashtags(posts)
                }
            };
        } catch (error) {
            console.error('Metrik hesaplama hatası:', error);
            throw error;
        }
    }

    calculateAvgEngagementRate(posts) {
        if (!posts.length) return 0;
        return posts.reduce((sum, post) => sum + post.engagement_rate, 0) / posts.length;
    }

    calculatePostingFrequency(posts) {
        if (posts.length < 2) return 'Yetersiz veri';
        
        const dates = posts.map(post => new Date(post.posted_at)).sort();
        const totalDays = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24);
        
        return posts.length / totalDays;
    }

    findBestPostingTime(posts) {
        const engagementByHour = new Array(24).fill(0).map(() => ({
            total_engagement: 0,
            count: 0
        }));

        posts.forEach(post => {
            const hour = new Date(post.posted_at).getHours();
            engagementByHour[hour].total_engagement += post.engagement_rate;
            engagementByHour[hour].count++;
        });

        return engagementByHour
            .map((data, hour) => ({
                hour,
                avg_engagement: data.count ? data.total_engagement / data.count : 0
            }))
            .sort((a, b) => b.avg_engagement - a.avg_engagement)
            .slice(0, 3);
    }

    sumMetric(posts, metric) {
        return posts.reduce((sum, post) => sum + (post[metric] || 0), 0);
    }

    avgMetric(posts, metric) {
        return posts.length ? this.sumMetric(posts, metric) / posts.length : 0;
    }

    calculateEngagementTrend(posts) {
        if (posts.length < 2) return 'Yetersiz veri';

        const sortedPosts = [...posts].sort((a, b) => 
            new Date(a.posted_at) - new Date(b.posted_at)
        );

        const firstHalf = sortedPosts.slice(0, Math.floor(posts.length / 2));
        const secondHalf = sortedPosts.slice(Math.floor(posts.length / 2));

        const firstHalfAvg = this.calculateAvgEngagementRate(firstHalf);
        const secondHalfAvg = this.calculateAvgEngagementRate(secondHalf);

        const trend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        return {
            percentage: trend,
            direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'
        };
    }

    findTopPosts(posts, limit = 5) {
        return [...posts]
            .sort((a, b) => b.engagement_rate - a.engagement_rate)
            .slice(0, limit)
            .map(post => ({
                id: post.id,
                engagement_rate: post.engagement_rate,
                likes: post.like_count,
                comments: post.comments_count,
                posted_at: post.posted_at,
                permalink: post.permalink
            }));
    }

    analyzeContentTypes(posts) {
        const types = {};
        posts.forEach(post => {
            types[post.content_type] = (types[post.content_type] || 0) + 1;
        });
        return types;
    }

    analyzeHashtags(posts) {
        const hashtags = {};
        posts.forEach(post => {
            const matches = post.caption?.match(/#[a-zA-Z0-9]+/g) || [];
            matches.forEach(tag => {
                if (!hashtags[tag]) {
                    hashtags[tag] = {
                        count: 0,
                        total_engagement: 0,
                        posts: []
                    };
                }
                hashtags[tag].count++;
                hashtags[tag].total_engagement += post.engagement_rate;
                hashtags[tag].posts.push(post.id);
            });
        });

        return Object.entries(hashtags)
            .map(([tag, data]) => ({
                tag,
                count: data.count,
                avg_engagement: data.total_engagement / data.count,
                posts: data.posts
            }))
            .sort((a, b) => b.avg_engagement - a.avg_engagement)
            .slice(0, 10);
    }
}

module.exports = new AnalyticsService(); 