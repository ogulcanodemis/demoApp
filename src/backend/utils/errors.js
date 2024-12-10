class ValidationError extends Error {
    constructor(message, details = []) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

class InstagramAPIError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'InstagramAPIError';
        this.originalError = originalError;
    }
}

module.exports = {
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    InstagramAPIError
}; 