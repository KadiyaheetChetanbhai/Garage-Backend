export const USER_TYPES = {
    SUPERADMIN: 'superadmin',
    GARAGE_ADMIN: 'garage-admin', 
    USER: 'user',
};
const logoUrl = `${process.env.SERVER_URL}/public/logo.png`;

export const EMAIL_COMMON_DATA = {
    appName: 'Pet Now',
    copyrightYear: '2025',
    logoUrl,
    websiteUrl: process.env.FRONTEND_URL,
    companyAddress: '123 Paw Street, Petville, USA',
    currentYear: new Date().getFullYear(),
    supportEmail: 'support@petnow.com',
    supportPhone: '+1 (555) 123-4567',
};

export const OBJECTID_PATTERN = /^[0-9a-fA-F]{24}$/;

export const TOKEN_EXPIRY_SHORT = '1d';
export const MAX_RESET_PASS_REQUESTS_PER_DAY = 5;
export const OTP_EXPIRATION_MINUTES = 10;
