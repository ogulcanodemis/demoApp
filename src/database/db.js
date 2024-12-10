const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(
    path.join(__dirname, 'instagram_marketing.db'),
    (err) => {
        if (err) {
            console.error('Veritabanına bağlanırken hata:', err);
        } else {
            console.log('Veritabanına başarıyla bağlanıldı');
        }
    }
);

module.exports = db; 