const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Instagram AI Marketing API',
            version: '1.0.0',
            description: 'Instagram pazarlama otomasyonu için AI destekli API',
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production' 
                    ? 'https://your-domain.com/api' 
                    : 'http://localhost:3000/api',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
    },
    apis: ['./src/backend/routes/*.js'], // Tüm route dosyalarını tara
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 