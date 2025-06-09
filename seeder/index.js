import mongoose from 'mongoose';
import { config as dotenvConfig } from 'dotenv';
import User from '../models/user.model.js';
import { clinics, services, users, cmsContents } from './data.js';
import {
    MODULES,
    PERMISSION_EVENTS,
} from '../constants/permission.constant.js';
import Permission from '../models/permission.model.js';
import logger from '../helpers/logger.helper.js';

dotenvConfig();

const connectDB = async () => {
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => logger.info('DB Connected successfully'))
        .catch((err) => {
            logger.error('DB Connection Error:', err);
            process.exit(1);
        });
};

const seedPermissions = async () => {
    try {
        for (const [moduleKey, moduleName] of Object.entries(MODULES)) {
            for (const event of Object.values(PERMISSION_EVENTS)) {
                const exists = await Permission.findOne({
                    name: moduleName,
                    module: moduleKey,
                    event: event,
                });

                if (!exists) {
                    await Permission.create({
                        name: moduleName,
                        module: moduleKey,
                        event,
                    });
                    logger.info(`Permission created: ${moduleName} - ${event}`);
                } else {
                    logger.info(
                        `Permission already exists: ${moduleName} - ${event}`,
                    );
                }
            }
        }
    } catch (error) {
        logger.error('Error while seeding permissions:', error);
    }
};

const seedUsers = async () => {
    const permissions = await Permission.find({});
    const permissionIds = permissions.map((p) => p._id);
    for (const userData of users) {
        try {
            const existingUser = await User.findOne({ email: userData.email });

            if (!existingUser) {
                const newUser = new User({
                    ...userData,
                    permissions: permissionIds,
                });
                await newUser.save();
                logger.info(`User ${userData.email} created.`);
            } else {
                Object.assign(existingUser, {
                    ...userData,
                    permissions: permissionIds,
                });
                await existingUser.save();
                logger.info(`User ${userData.email} already exists. Updated.`);
            }
        } catch (error) {
            logger.error(
                `Error while processing user ${userData.email}:`,
                error,
            );
        }
    }
};







const seedData = async () => {
    try {
        await connectDB();
        await seedPermissions();
        await Promise.all([
            seedUsers(),
        ]);
    } catch (error) {
        logger.error('Error while seeding data:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedData();
