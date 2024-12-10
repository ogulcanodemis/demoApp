const request = require('supertest');
const app = require('../src/backend/server');
const db = require('../src/backend/database/db');
const jwt = require('jsonwebtoken');

describe('Calendar API Endpoints', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        userId = 1;
        authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);

        await new Promise((resolve) => {
            db.run('DELETE FROM content_calendar', [], resolve);
        });
    });

    describe('Event Management', () => {
        it('should create new event', async () => {
            const res = await request(app)
                .post('/api/calendar/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    post_title: 'Test Event',
                    post_description: 'Test Description',
                    planned_date: '2024-01-01T10:00:00'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.post_title).toBe('Test Event');
        });

        it('should list events', async () => {
            const res = await request(app)
                .get('/api/calendar/events')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
        });

        it('should update event', async () => {
            // Önce test event'i oluştur
            const eventId = await new Promise((resolve) => {
                db.run(
                    `INSERT INTO content_calendar (user_id, post_title, planned_date)
                     VALUES (?, ?, ?)`,
                    [userId, 'Update Test', '2024-01-02T10:00:00'],
                    function(err) {
                        resolve(this.lastID);
                    }
                );
            });

            const res = await request(app)
                .put(`/api/calendar/events/${eventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    post_title: 'Updated Title',
                    planned_date: '2024-01-02T11:00:00'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Etkinlik güncellendi');
        });
    });
}); 