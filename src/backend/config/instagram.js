const Instagram = require('instagram-web-api');
const FileCookieStore = require('tough-cookie-filestore2');

const cookieStore = new FileCookieStore('./cookies.json');

const createInstagramClient = (username, password) => {
    return new Instagram({
        username,
        password,
        cookieStore
    });
};

module.exports = {
    createInstagramClient
}; 