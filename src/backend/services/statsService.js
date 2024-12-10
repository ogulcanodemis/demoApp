const db = require('../database/db');
const instagramService = require('./instagramService');

class StatsService {
    async getPublishingStats(userId, period = '30d') {
        try {
            const events = await db.getContentCalendar();
            const userEvents = events.filter(event => event.user_id === userId);
            
            const startDate = this.getStartDate(period);
            const filteredEvents = userEvents.filter(event => 
                new Date(event.planned_date) >= startDate
            );

            return {
                total_posts: filteredEvents.length,
                published: this.countByStatus(filteredEvents, 'published'),
                failed: this.countByStatus(filteredEvents, 'failed'),
                planned: this.countByStatus(filteredEvents, 'planned'),
                success_rate: this.calculateSuccessRate(filteredEvents),
                best_times: this.analyzeBestTimes(filteredEvents),
                content_types: this.analyzeContentTypes(filteredEvents),
                engagement_stats: await this.getEngagementStats(filteredEvents),
                daily_stats: this.getDailyStats(filteredEvents)
            };
        } catch (error) {
            console.error('İstatistik hesaplama hatası:', error);
            throw error;
        }
    }

    getStartDate(period) {
        const now = new Date();
        switch (period) {
            case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
            case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
            case '90d': return new Date(now - 90 * 24 * 60 * 60 * 1000);
            default: return new Date(now - 30 * 24 * 60 * 60 * 1000);
        }
    }

    countByStatus(events, status) {
        return events.filter(event => event.status === status).length;
    }

    calculateSuccessRate(events) {
        const published = this.countByStatus(events, 'published');
        const total = events.filter(event => event.status !== 'planned').length;
        return total ? (published / total) * 100 : 0;
    }

    analyzeBestTimes(events) {
        const publishedEvents = events.filter(event => event.status === 'published');
        const timeStats = {};

        publishedEvents.forEach(event => {
            const date = new Date(event.published_at);
            const hour = date.getHours();
            
            if (!timeStats[hour]) {
                timeStats[hour] = {
                    count: 0,
                    total_engagement: 0
                };
            }

            timeStats[hour].count++;
            if (event.engagement_rate) {
                timeStats[hour].total_engagement += event.engagement_rate;
            }
        });

        return Object.entries(timeStats)
            .map(([hour, stats]) => ({
                hour: parseInt(hour),
                posts: stats.count,
                avg_engagement: stats.count ? stats.total_engagement / stats.count : 0
            }))
            .sort((a, b) => b.avg_engagement - a.avg_engagement);
    }

    analyzeContentTypes(events) {
        const typeStats = {};
        
        events.forEach(event => {
            const type = event.content_type || 'unknown';
            if (!typeStats[type]) {
                typeStats[type] = {
                    count: 0,
                    published: 0,
                    failed: 0,
                    total_engagement: 0
                };
            }

            typeStats[type].count++;
            if (event.status === 'published') {
                typeStats[type].published++;
                if (event.engagement_rate) {
                    typeStats[type].total_engagement += event.engagement_rate;
                }
            } else if (event.status === 'failed') {
                typeStats[type].failed++;
            }
        });

        return Object.entries(typeStats).map(([type, stats]) => ({
            type,
            total: stats.count,
            published: stats.published,
            failed: stats.failed,
            avg_engagement: stats.published ? stats.total_engagement / stats.published : 0
        }));
    }

    async getEngagementStats(events) {
        const publishedEvents = events.filter(event => 
            event.status === 'published' && event.instagram_post_id
        );

        const engagementData = await Promise.all(
            publishedEvents.map(async event => {
                try {
                    const stats = await instagramService.getPostStats(
                        event.instagram_post_id,
                        event.account_id
                    );
                    return {
                        post_id: event.instagram_post_id,
                        likes: stats.like_count,
                        comments: stats.comments_count,
                        saves: stats.save_count,
                        shares: stats.share_count,
                        reach: stats.reach,
                        engagement_rate: this.calculateEngagementRate(stats)
                    };
                } catch (error) {
                    console.error(`Post istatistikleri alınamadı: ${event.id}`, error);
                    return null;
                }
            })
        );

        const validData = engagementData.filter(data => data !== null);

        return {
            avg_likes: this.calculateAverage(validData, 'likes'),
            avg_comments: this.calculateAverage(validData, 'comments'),
            avg_saves: this.calculateAverage(validData, 'saves'),
            avg_shares: this.calculateAverage(validData, 'shares'),
            avg_reach: this.calculateAverage(validData, 'reach'),
            avg_engagement_rate: this.calculateAverage(validData, 'engagement_rate'),
            engagement_trend: this.calculateEngagementTrend(validData)
        };
    }

    calculateEngagementRate(stats) {
        const interactions = stats.like_count + stats.comments_count + 
                           stats.save_count + stats.share_count;
        return stats.reach ? (interactions / stats.reach) * 100 : 0;
    }

    calculateAverage(data, field) {
        if (!data.length) return 0;
        const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
        return sum / data.length;
    }

    calculateEngagementTrend(data) {
        if (data.length < 2) return null;

        const sortedData = [...data].sort((a, b) => 
            new Date(a.created_at) - new Date(b.created_at)
        );

        const midPoint = Math.floor(data.length / 2);
        const firstHalf = sortedData.slice(0, midPoint);
        const secondHalf = sortedData.slice(midPoint);

        const firstHalfAvg = this.calculateAverage(firstHalf, 'engagement_rate');
        const secondHalfAvg = this.calculateAverage(secondHalf, 'engagement_rate');

        const trend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        return {
            percentage: trend,
            direction: trend > 0 ? 'up' : 'down',
            first_period_avg: firstHalfAvg,
            second_period_avg: secondHalfAvg
        };
    }

    getDailyStats(events) {
        const dailyStats = {};
        
        events.forEach(event => {
            const date = new Date(event.planned_date).toISOString().split('T')[0];
            
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    total: 0,
                    published: 0,
                    failed: 0,
                    engagement: 0
                };
            }

            dailyStats[date].total++;
            if (event.status === 'published') {
                dailyStats[date].published++;
                if (event.engagement_rate) {
                    dailyStats[date].engagement += event.engagement_rate;
                }
            } else if (event.status === 'failed') {
                dailyStats[date].failed++;
            }
        });

        return Object.entries(dailyStats)
            .map(([date, stats]) => ({
                date,
                total: stats.total,
                published: stats.published,
                failed: stats.failed,
                avg_engagement: stats.published ? stats.engagement / stats.published : 0
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
}

module.exports = new StatsService(); 