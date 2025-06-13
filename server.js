import express from 'express';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();
import cors from 'cors';
import './helpers/connectDB.helper.js';
import { swaggerOptions, swaggerSpec, swaggerUi } from './swagger.js';
import errorHandler from './middlewares/errorHandler.middleware.js';
import requestLogger from './middlewares/requestLogger.middleware.js';
import routes from './routes/index.route.js';
import path from 'path';
import logger from './helpers/logger.helper.js';
import agenda, { defineReminderJobs } from './agenda/agenda.js';



defineReminderJobs(agenda);
await agenda.start();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/public', express.static(path.join(process.cwd(), 'public')));
app.use('/logs', express.static(path.join(process.cwd(), 'logs')));

// Apply request logger middleware
app.use(requestLogger);

app.use('/', routes);
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerOptions),
);
app.get('/', (req, res) => {
    res.send('Greetings from Vehical Wellness');
});
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server running on port: ${PORT}`);
});



// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
    process.exit(1);
});
