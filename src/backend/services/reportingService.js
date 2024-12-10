const db = require('../database/db');
const analyticsService = require('./analyticsService');

class ReportingService {
    async generateReport(accountId, reportType = 'weekly') {
        try {
            const account = await db.getAccountById(accountId);
            const metrics = await analyticsService.calculateMetrics(accountId);
            
            const report = {
                generated_at: new Date().toISOString(),
                account_name: account.account_name,
                report_type: reportType,
                summary: this.generateSummary(metrics),
                recommendations: await this.generateRecommendations(metrics),
                metrics: metrics,
                insights: this.generateInsights(metrics)
            };

            // Raporu kaydet
            await db.createReport({
                account_id: accountId,
                report_type: reportType,
                content: report
            });

            return report;
        } catch (error) {
            console.error('Rapor oluşturma hatası:', error);
            throw error;
        }
    }

    generateSummary(metrics) {
        const {
            account_metrics,
            recent_performance,
            content_analysis
        } = metrics;

        return {
            overview: `Son ${recent_performance.posts_count} gönderide ortalama ${account_metrics.avg_engagement_rate.toFixed(2)}% etkileşim oranı.`,
            trend: this.describeTrend(recent_performance.engagement_trend),
            top_content: `En iyi performans gösteren içerik türü: ${this.findBestContentType(content_analysis.content_type_distribution)}`,
            posting_schedule: `Optimal paylaşım sıklığı: ${this.formatPostingFrequency(account_metrics.posting_frequency)}`
        };
    }

    async generateRecommendations(metrics) {
        const recommendations = [];

        // Etkileşim oranı önerileri
        if (metrics.account_metrics.avg_engagement_rate < 3) {
            recommendations.push({
                type: 'engagement',
                title: 'Etkileşim Oranını Artırın',
                suggestions: [
                    'Takipçilerinizle daha fazla etkileşime geçin',
                    'Sorular sorarak yorumları teşvik edin',
                    'Instagram Stories\'i daha aktif kullanın'
                ]
            });
        }

        // Paylaşım zamanlaması önerileri
        const bestTimes = metrics.account_metrics.best_posting_time;
        recommendations.push({
            type: 'timing',
            title: 'Optimal Paylaşım Zamanları',
            suggestions: bestTimes.map(time => 
                `Saat ${time.hour}:00 civarı paylaşım yapın (${time.avg_engagement.toFixed(2)}% etkileşim)`
            )
        });

        // Hashtag önerileri
        const topHashtags = metrics.content_analysis.hashtag_performance;
        recommendations.push({
            type: 'hashtags',
            title: 'Önerilen Hashtagler',
            suggestions: topHashtags.slice(0, 5).map(tag => 
                `${tag.tag} (${tag.avg_engagement.toFixed(2)}% etkileşim)`
            )
        });

        return recommendations;
    }

    generateInsights(metrics) {
        return {
            growth_opportunities: this.identifyGrowthOpportunities(metrics),
            content_strategy: this.analyzeContentStrategy(metrics),
            audience_insights: this.analyzeAudienceEngagement(metrics)
        };
    }

    describeTrend(trend) {
        if (trend === 'Yetersiz veri') return trend;
        
        const direction = trend.direction;
        const percentage = Math.abs(trend.percentage).toFixed(2);
        
        return `Etkileşim oranı ${direction === 'up' ? 'artıyor' : 'azalıyor'} (%${percentage})`;
    }

    findBestContentType(distribution) {
        return Object.entries(distribution)
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    formatPostingFrequency(frequency) {
        if (frequency === 'Yetersiz veri') return frequency;
        return `Haftada ${(frequency * 7).toFixed(1)} gönderi`;
    }

    identifyGrowthOpportunities(metrics) {
        const opportunities = [];
        const { account_metrics, recent_performance } = metrics;

        if (account_metrics.posting_frequency < 0.5) {
            opportunities.push('Paylaşım sıklığını artırın');
        }

        if (recent_performance.engagement_trend.direction === 'down') {
            opportunities.push('Etkileşimi artırmak için içerik stratejinizi gözden geçirin');
        }

        return opportunities;
    }

    analyzeContentStrategy(metrics) {
        const { content_analysis } = metrics;
        const topPosts = content_analysis.top_performing_posts;

        return {
            best_content_types: this.findTopContentTypes(content_analysis.content_type_distribution),
            successful_patterns: this.findContentPatterns(topPosts)
        };
    }

    findTopContentTypes(distribution) {
        return Object.entries(distribution)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({
                type,
                count,
                percentage: (count / Object.values(distribution).reduce((a, b) => a + b, 0) * 100).toFixed(2)
            }));
    }

    findContentPatterns(topPosts) {
        const patterns = {
            hashtags: new Set(),
            caption_length: 0,
            posting_times: []
        };

        topPosts.forEach(post => {
            if (post.caption) {
                const hashtags = post.caption.match(/#[a-zA-Z0-9]+/g) || [];
                hashtags.forEach(tag => patterns.hashtags.add(tag));
                patterns.caption_length += post.caption.length;
            }
            patterns.posting_times.push(new Date(post.posted_at).getHours());
        });

        return {
            avg_caption_length: Math.round(patterns.caption_length / topPosts.length),
            common_hashtags: Array.from(patterns.hashtags).slice(0, 5),
            best_posting_times: this.findMostFrequent(patterns.posting_times)
        };
    }

    findMostFrequent(arr) {
        const frequency = {};
        arr.forEach(item => {
            frequency[item] = (frequency[item] || 0) + 1;
        });
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([hour]) => `${hour}:00`);
    }

    analyzeAudienceEngagement(metrics) {
        const { recent_performance } = metrics;
        
        return {
            engagement_rate: {
                likes: recent_performance.avg_likes_per_post,
                comments: recent_performance.avg_comments_per_post,
                total: metrics.account_metrics.avg_engagement_rate
            },
            best_performing_content: metrics.content_analysis.top_performing_posts.slice(0, 3)
        };
    }
}

module.exports = new ReportingService(); 