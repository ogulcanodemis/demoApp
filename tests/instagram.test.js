const request = require('supertest');
const app = require('../src/backend/server');
const db = require('../src/backend/database/db');
const jwt = require('jsonwebtoken');

describe('Instagram API Endpoints', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        // Test kullanıcısı oluştur ve token al
        userId = 1;
        authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET);

        // Test veritabanını temizle
        await Promise.all([
            new Promise((resolve) => {
                db.run('DELETE FROM instagram_accounts', [], resolve);
            }),
            new Promise((resolve) => {
                db.run('DELETE FROM posts', [], resolve);
            })
        ]);
    });

    describe('Instagram Account Management', () => {
        it('should add new Instagram account', async () => {
            const res = await request(app)
                .post('/api/instagram/accounts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    account_name: 'testaccount',
                    access_token: 'test-token'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.account_name).toBe('testaccount');
        });

        it('should list Instagram accounts', async () => {
            const res = await request(app)
                .get('/api/instagram/accounts')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBeGreaterThan(0);
        });
    });

    describe('Post Analysis', () => {
        it('should analyze Instagram post', async () => {
            // Önce test post'u oluştur
            const postId = await new Promise((resolve) => {
                db.run(
                    `INSERT INTO posts (instagram_account_id, post_id, content_type, caption)
                     VALUES (?, ?, ?, ?)`,
                    [1, 'test-post', 'image', 'Test caption #test'],
                    function(err) {
                        resolve(this.lastID);
                    }
                );
            });

            const res = await request(app)
                .get(`/api/instagram/posts/analyze/${postId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('analysis');
        });
    });
}); 