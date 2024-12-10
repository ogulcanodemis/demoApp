const db = require('../database/db');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const calendarController = {
    getEvents: async (req, res) => {
        try {
            const { start_date, end_date } = req.query;
            let sql = `
                SELECT * FROM content_calendar 
                WHERE user_id = ?
            `;
            const params = [req.user.id];

            if (start_date && end_date) {
                sql += ` AND planned_date BETWEEN ? AND ?`;
                params.push(start_date, end_date);
            }

            sql += ` ORDER BY planned_date ASC`;

            db.all(sql, params, (err, events) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(events);
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createEvent: async (req, res) => {
        try {
            const { post_title, post_description, planned_date } = req.body;
            const sql = `
                INSERT INTO content_calendar (
                    user_id, post_title, post_description, planned_date
                ) VALUES (?, ?, ?, ?)
            `;

            db.run(sql, [req.user.id, post_title, post_description, planned_date], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                res.status(201).json({
                    id: this.lastID,
                    post_title,
                    post_description,
                    planned_date
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateEvent: async (req, res) => {
        try {
            const { post_title, post_description, planned_date, status } = req.body;
            const sql = `
                UPDATE content_calendar 
                SET post_title = ?, 
                    post_description = ?, 
                    planned_date = ?,
                    status = ?
                WHERE id = ? AND user_id = ?
            `;

            db.run(sql, [post_title, post_description, planned_date, status, req.params.id, req.user.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Etkinlik bulunamadı' });
                }
                res.json({ message: 'Etkinlik güncellendi' });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteEvent: async (req, res) => {
        try {
            const sql = `DELETE FROM content_calendar WHERE id = ? AND user_id = ?`;
            db.run(sql, [req.params.id, req.user.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Etkinlik bulunamadı' });
                }
                res.json({ message: 'Etkinlik silindi' });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    analyzeEvent: async (req, res) => {
        try {
            const sql = `SELECT * FROM content_calendar WHERE id = ? AND user_id = ?`;
            db.get(sql, [req.params.id, req.user.id], async (err, event) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!event) return res.status(404).json({ error: 'Etkinlik bulunamadı' });

                const analysis = await openai.createCompletion({
                    model: "text-davinci-003",
                    prompt: `Analyze this planned Instagram post:
                            Title: ${event.post_title}
                            Description: ${event.post_description}
                            Planned Date: ${event.planned_date}
                            
                            Provide suggestions for:
                            1. Content optimization
                            2. Best hashtags to use
                            3. Potential engagement strategies
                            4. Timing optimization`,
                    max_tokens: 500
                });

                res.json({
                    event,
                    analysis: analysis.data.choices[0].text
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getContentSuggestions: async (req, res) => {
        try {
            const { month, year } = req.query;
            const sql = `
                SELECT 
                    strftime('%w', planned_date) as day_of_week,
                    COUNT(*) as post_count,
                    AVG(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as completion_rate
                FROM content_calendar
                WHERE user_id = ? 
                AND strftime('%m-%Y', planned_date) = ?
                GROUP BY day_of_week
                ORDER BY day_of_week
            `;

            db.all(sql, [req.user.id, `${month}-${year}`], async (err, stats) => {
                if (err) return res.status(500).json({ error: err.message });

                const suggestions = await openai.createCompletion({
                    model: "text-davinci-003",
                    prompt: `Based on these content calendar statistics:
                            ${stats.map(stat => `
                                Day: ${stat.day_of_week}
                                Posts: ${stat.post_count}
                                Completion Rate: ${stat.completion_rate}
                            `).join('\n')}
                            
                            Suggest optimal content planning strategy for next month.`,
                    max_tokens: 500
                });

                res.json({
                    stats,
                    suggestions: suggestions.data.choices[0].text
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getCalendarStats: async (req, res) => {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_events,
                    SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_events,
                    SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) as planned_events,
                    strftime('%m-%Y', planned_date) as month_year
                FROM content_calendar
                WHERE user_id = ?
                GROUP BY month_year
                ORDER BY month_year DESC
                LIMIT 6
            `;

            db.all(sql, [req.user.id], (err, stats) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(stats);
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = calendarController; 