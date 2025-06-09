import mongoose from 'mongoose';
import { config as dotenvConfig } from 'dotenv';
import logger from './logger.helper.js';
dotenvConfig();

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => logger.info('DB Connected successfully'))
    .catch((err) => logger.error('Failed to connect to DB:', err));

mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
    logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    logger.info('Mongoose disconnected from DB.');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('Mongoose connection closed due to application termination');
    process.exit(0);
});
