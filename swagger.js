import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '24/7 Garage API',
            version: '1.0.0',
            description: 'API documentation for the 24/7 Garage project',
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ BearerAuth: [] }],
        tags: [],
    },
    apis: ['./routes/**/*.js'],
};

const swaggerOptions = {
    swaggerOptions: {
        persistAuthorization: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Vehical Wellness API Documentation',
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec, swaggerOptions };
