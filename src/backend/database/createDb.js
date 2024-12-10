const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'instagram_marketing.db');
console.log('Veritabanı oluşturuluyor:', dbPath);

const db = new sqlite3.Database(dbPath);

db.run('PRAGMA foreign_keys = ON');

const schema = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS instagram_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_name TEXT NOT NULL,
    access_token TEXT,
    is_competitor INTEGER DEFAULT 0,
    followers INTEGER DEFAULT 0,
    engagement_rate REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, account_name)
);`;

db.serialize(() => {
    // Tabloları temizle
    db.run('DROP TABLE IF EXISTS instagram_accounts');
    db.run('DROP TABLE IF EXISTS users');

    // Tabloları oluştur
    db.exec(schema, (err) => {
        if (err) {
            console.error('Veritabanı oluşturulurken hata:', err);
            process.exit(1);
        }
        console.log('Veritabanı başarıyla oluşturuldu');
    });
});

// Test verisi ekle
db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
    if (err) {
        console.error('Test verisi kontrolü hatası:', err);
        return;
    }

    if (row.count === 0) {
        const testUser = {
            username: 'test',
            email: 'test@test.com',
            password: '$2a$10$YourHashedPasswordHere' // bcrypt ile hashlenmiş şifre
        };

        db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [testUser.username, testUser.email, testUser.password],
            function(err) {
                if (err) {
                    console.error('Test kullanıcısı eklenirken hata:', err);
                } else {
                    console.log('Test kullanıcısı eklendi, ID:', this.lastID);
                }
            }
        );
    }
});

module.exports = db; 