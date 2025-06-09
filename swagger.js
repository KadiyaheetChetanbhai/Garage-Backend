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
        tags: [
            { name: 'Admin Authentication' },
            { name: 'Admin Forgot Password' },
            { name: 'Admin Common' },
            { name: 'Admin Management' },
            { name: 'Admin Contact' },
            { name: 'Admin Clinic Management' },
            { name: 'Admin Diet Management' },
            { name: 'Admin Homemade Diet Management' },
            { name: 'Admin service management' },
            { name: 'Admin Store Management' },
            { name: 'Admin Dietary Requirement Management' },
            { name: 'Admin Symptom Management' },
            { name: 'Admin Diseases Management' },
            { name: 'Admin FAQ Management' },
            { name: 'Admin Booking Management' },
            { name: 'Admin Doctor Management' },
            { name: 'Admin Social Media Management' },
            { name: 'Admin CMS Management' },
            { name: 'Admin ContactInfo' },
            { name: 'Admin Brand Management' },
            { name: 'Admin Helpful Resource Management' },
            { name: 'Contact' },
            { name: 'ContactInfo' },
            { name: 'Subscription' },
            { name: 'Pet Services' },
            { name: 'Clinics' },
            { name: 'Bookings' },
            { name: 'Dietary Requirements' },
            { name: 'Diets' },
            { name: 'Homemade Diets' },
            { name: 'Symptoms' },
            { name: 'Diseases' },
            { name: 'Stores' },
            { name: 'Helpful Resources' },
        ],
    },
    apis: ['./routes/**/*.js'],
};

const swaggerOptions = {
    swaggerOptions: {
        persistAuthorization: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Pet Now API Documentation',
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec, swaggerOptions };
