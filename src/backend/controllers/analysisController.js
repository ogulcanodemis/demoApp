const db = require('../database/db');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const analysisController = {
    getContentSuggestions: async (req, res) => {
        try {
            // Kullanıcının geçmiş postlarını al
            const sql = `
                SELECT p.* 
                FROM posts p
                JOIN instagram_accounts a ON p.instagram_account_id = a.id
                WHERE a.user_id = ? AND a.is_competitor = FALSE
                ORDER BY p.engagement_rate DESC
                LIMIT 5
            `;

            db.all(sql, [req.user.id], async (err, topPosts) => {
                if (err) return res.status(500).json({ error: err.message });

                // OpenAI ile içerik önerileri al
                const prompt = `Based on these top performing posts:
                    ${topPosts.map(post => `
                        Caption: ${post.caption}
                        Engagement Rate: ${post.engagement_rate}
                        Likes: ${post.likes}
                        Comments: ${post.comments}
                    `).join('\n')}
                    
                    Suggest 5 new content ideas that could perform well.`;

                const suggestions = await openai.createCompletion({
                    model: "text-davinci-003",
                    prompt,
                    max_tokens: 500
                });

                res.json({
                    topPosts,
                    suggestions: suggestions.data.choices[0].text
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getHashtagSuggestions: async (req, res) => {
        try {
            const { content } = req.query;
            
            const suggestions = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: `Suggest relevant hashtags for this Instagram post content:
                        "${content}"
                        
                        Provide a mix of popular and niche hashtags that would help reach the target audience.`,
                max_tokens: 200
            });

            res.json({
                hashtags: suggestions.data.choices[0].text
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getBestPostingTimes: async (req, res) => {
        try {
            const sql = `
                SELECT 
                    strftime('%H', posted_at) as hour,
                    AVG(engagement_rate) as avg_engagement,
                    COUNT(*) as post_count
                FROM posts p
                JOIN instagram_accounts a ON p.instagram_account_id = a.id
                WHERE a.user_id = ? AND a.is_competitor = FALSE
                GROUP BY hour
                ORDER BY avg_engagement DESC
            `;

            db.all(sql, [req.user.id], (err, times) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(times);
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getCompetitorAnalysis: async (req, res) => {
        try {
            // Rakiplerin post verilerini al
            const sql = `
                SELECT 
                    a.account_name,
                    p.content_type,
                    p.caption,
                    p.hashtags,
                    p.engagement_rate,
                    p.likes,
                    p.comments
                FROM posts p
                JOIN instagram_accounts a ON p.instagram_account_id = a.id
                WHERE a.user_id = ? AND a.is_competitor = TRUE
                ORDER BY p.engagement_rate DESC
                LIMIT 10
            `;

            db.all(sql, [req.user.id], async (err, competitorPosts) => {
                if (err) return res.status(500).json({ error: err.message });

                // OpenAI ile rakip analizi yap
                const analysis = await openai.createCompletion({
                    model: "text-davinci-003",
                    prompt: `Analyze these top performing competitor posts:
                            ${competitorPosts.map(post => `
                                Account: ${post.account_name}
                                Content Type: ${post.content_type}
                                Caption: ${post.caption}
                                Hashtags: ${post.hashtags}
                                Engagement Rate: ${post.engagement_rate}
                                Likes: ${post.likes}
                                Comments: ${post.comments}
                            `).join('\n')}
                            
                            Provide insights on:
                            1. Common patterns in successful posts
                            2. Content strategies being used
                            3. Hashtag strategies
                            4. Engagement patterns
                            5. Recommendations for improvement`,
                    max_tokens: 1000
                });

                res.json({
                    competitorPosts,
                    analysis: analysis.data.choices[0].text
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = analysisController; 