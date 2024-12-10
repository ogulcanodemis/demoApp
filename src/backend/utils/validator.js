const { ValidationError } = require('./errors');

const validator = {
    validateEvent: (data) => {
        const errors = [];

        if (!data.post_title) {
            errors.push('Başlık zorunludur');
        }

        if (!data.planned_date) {
            errors.push('Tarih zorunludur');
        }

        if (errors.length > 0) {
            throw new ValidationError('Geçersiz etkinlik verisi', errors);
        }

        return true;
    },

    validateInstagramAccount: (data) => {
        const errors = [];

        if (!data.account_name) {
            errors.push('Hesap adı zorunludur');
        }

        if (!data.access_token && !data.is_competitor) {
            errors.push('Access token zorunludur');
        }

        if (errors.length > 0) {
            throw new ValidationError('Geçersiz Instagram hesap verisi', errors);
        }

        return true;
    }
};

module.exports = validator; 