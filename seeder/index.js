import { config as dotenvConfig } from 'dotenv';
import mongoose from 'mongoose';
import {
    MODULES,
    PERMISSION_EVENTS,
} from '../constants/permission.constant.js';
import logger from '../helpers/logger.helper.js';
import Permission from '../models/permission.model.js';
import User from '../models/user.model.js';
import SuperAdmin from '../models/superAdmin.model.js'; // Add this import
import { garageAdmins, superAdmins, users } from './data.js';
import garageOwner from '../models/garageOwner.model.js';

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

const seedSuperAdmins = async () => {
    const permissions = await Permission.find({});
    const permissionIds = permissions.map((p) => p._id);
    for (const userData of superAdmins) {
        try {
            const existingSuperAdmin = await SuperAdmin.findOne({
                email: userData.email,
            });

            if (!existingSuperAdmin) {
                const newSuperAdmin = new SuperAdmin({
                    ...userData,
                    permissions: permissionIds,
                });
                await newSuperAdmin.save();
                logger.info(`SuperAdmin ${userData.email} created.`);
            } else {
                Object.assign(existingSuperAdmin, {
                    ...userData,
                    permissions: permissionIds,
                });
                await existingSuperAdmin.save();
                logger.info(
                    `SuperAdmin ${userData.email} already exists. Updated.`,
                );
            }
        } catch (error) {
            logger.error(
                `Error while processing superadmin ${userData.email}:`,
                error,
            );
        }
    }
};

const seedUsers = async () => {
    for (const userData of users) {
        try {
            const existingUser = await User.findOne({ email: userData.email });

            if (!existingUser) {
                const newUser = new User({
                    ...userData,
                });
                await newUser.save();
                logger.info(`User ${userData.email} created.`);
            } else {
                Object.assign(existingUser, {
                    ...userData,
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

const seedGarageOwners = async () => {
    // Get a subset of permissions appropriate for garage owners
    const garagePermissions = await Permission.find({
        module: { $in: ['GARAGE', 'SERVICE', 'TRANSPORT'] },
    });
    const garagePermissionIds = garagePermissions.map((p) => p._id);

    for (const ownerData of garageAdmins) {
        try {
            const existingOwner = await garageOwner.findOne({
                email: ownerData.email,
            });

            if (!existingOwner) {
                const newOwner = new garageOwner({
                    ...ownerData,
                    permissions: garagePermissionIds,
                });
                await newOwner.save();
                logger.info(`Garage Owner ${ownerData.email} created.`);
            } else {
                Object.assign(existingOwner, {
                    ...ownerData,
                    permissions: garagePermissionIds,
                });
                await existingOwner.save();
                logger.info(
                    `Garage Owner ${ownerData.email} already exists. Updated.`,
                );
            }
        } catch (error) {
            logger.error(
                `Error while processing garage owner ${ownerData.email}:`,
                error,
            );
        }
    }
};

const seedData = async () => {
    try {
        await connectDB();
        await seedPermissions();
        await Promise.all([seedSuperAdmins(), seedUsers(), seedGarageOwners()]);
    } catch (error) {
        logger.error('Error while seeding data:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedData();
