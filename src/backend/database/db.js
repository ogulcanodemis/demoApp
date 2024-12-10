const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '../data');
const USERS_FILE = path.join(DB_PATH, 'users.json');
const ACCOUNTS_FILE = path.join(DB_PATH, 'instagram_accounts.json');
const POSTS_FILE = path.join(DB_PATH, 'posts.json');

// Veritabanı dosyalarını oluştur
async function initDB() {
    try {
        await fs.mkdir(DB_PATH, { recursive: true });
        
        // users.json yoksa oluştur
        try {
            await fs.access(USERS_FILE);
        } catch {
            await fs.writeFile(USERS_FILE, JSON.stringify([]));
        }
        
        // instagram_accounts.json yoksa oluştur
        try {
            await fs.access(ACCOUNTS_FILE);
        } catch {
            await fs.writeFile(ACCOUNTS_FILE, JSON.stringify([]));
        }
        
        // posts.json yoksa oluştur
        try {
            await fs.access(POSTS_FILE);
        } catch {
            await fs.writeFile(POSTS_FILE, JSON.stringify([]));
        }
        
        console.log('Veritabanı başarıyla oluşturuldu');
    } catch (error) {
        console.error('Veritabanı oluşturulurken hata:', error);
        throw error;
    }
}

const db = {
    // Kullanıcı işlemleri
    async getUsers() {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    },

    async getUserById(id) {
        const users = await this.getUsers();
        return users.find(user => user.id === id);
    },

    async getUserByEmail(email) {
        const users = await this.getUsers();
        return users.find(user => user.email === email);
    },

    async createUser(userData) {
        const users = await this.getUsers();
        const newUser = {
            id: users.length + 1,
            ...userData,
            created_at: new Date().toISOString()
        };
        users.push(newUser);
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        return newUser;
    },

    // Instagram hesap işlemleri
    async getAccounts() {
        const data = await fs.readFile(ACCOUNTS_FILE, 'utf8');
        return JSON.parse(data);
    },

    async getAccountsByUserId(userId) {
        const accounts = await this.getAccounts();
        return accounts.filter(account => account.user_id === userId);
    },

    async createAccount(accountData) {
        const accounts = await this.getAccounts();
        const newAccount = {
            id: accounts.length + 1,
            ...accountData,
            created_at: new Date().toISOString()
        };
        accounts.push(newAccount);
        await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
        return newAccount;
    },

    async deleteAccount(id, userId) {
        const accounts = await this.getAccounts();
        const filteredAccounts = accounts.filter(account => 
            !(account.id === id && account.user_id === userId)
        );
        await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(filteredAccounts, null, 2));
        return filteredAccounts.length < accounts.length;
    },

    async getAccountById(id) {
        const accounts = await this.getAccounts();
        return accounts.find(account => account.id === id);
    },

    // Webhook verilerini saklamak için yeni metodlar
    async updateAccountStats(accountId, stats) {
        const accounts = await this.getAccounts();
        const index = accounts.findIndex(acc => acc.id === accountId);
        
        if (index !== -1) {
            accounts[index] = {
                ...accounts[index],
                ...stats
            };
            await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
            return accounts[index];
        }
        return null;
    },

    async createPost(postData) {
        const posts = await this.getPosts();
        const newPost = {
            id: posts.length + 1,
            ...postData
        };
        posts.push(newPost);
        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
        return newPost;
    },

    async getAccountByInstagramId(instagramId) {
        const accounts = await this.getAccounts();
        return accounts.find(acc => acc.instagram_id === instagramId);
    }
};

// Veritabanını başlat
initDB().catch(console.error);

module.exports = db;