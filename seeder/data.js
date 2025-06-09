import { USER_TYPES } from '../constants/common.constant.js';

export const users = [
    {
        name: 'Admin',
        email: 'petnowadmin@yopmail.com',
        userType: USER_TYPES.ADMIN,
        password: 'Pa$w0rd!',
        isEditable: false,
    },
];

export const services = [];

export const clinics = [];

export const cmsContents = [
    {
        type: 'PRIVACY_POLICY',
        title: 'Privacy Policy',
        content: `<h1>Privacy Policy</h1>
        <p>Last updated: ${new Date().toLocaleDateString()}</p>
        <p>This Privacy Policy describes how PetNow ("we," "us," or "our") collects, uses, and shares your personal information when you use our services, website, or mobile application.</p>
        <h2>Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account, update your profile, use interactive features, make a booking, participate in surveys, or communicate with us.</p>
        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, to process your bookings, and to communicate with you.</p>
        <h2>Information Sharing</h2>
        <p>We may share your information with service providers, business partners, and other third parties in connection with providing our services to you.</p>
        <h2>Changes to This Privacy Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at support@petnow.com.</p>`,
        isActive: true,
    },
    {
        type: 'TERMS_CONDITIONS',
        title: 'Terms and Conditions',
        content: `<h1>Terms and Conditions</h1>
        <p>Last updated: ${new Date().toLocaleDateString()}</p>
        <p>Please read these Terms and Conditions carefully before using the PetNow services, website, or mobile application.</p>
        <h2>Acceptance of Terms</h2>
        <p>By accessing or using our services, you agree to be bound by these Terms and Conditions and our Privacy Policy.</p>
        <h2>User Accounts</h2>
        <p>When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding your account credentials and for all activities that occur under your account.</p>
        <h2>Bookings and Appointments</h2>
        <p>When you make a booking through our platform, you agree to honor the appointment and to provide timely notice if you need to cancel or reschedule.</p>
        <h2>Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, PetNow shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services.</p>
        <h2>Changes to These Terms</h2>
        <p>We may update these Terms and Conditions from time to time. We will notify you of any changes by posting the new Terms and Conditions on this page.</p>
        <h2>Contact Us</h2>
        <p>If you have any questions about these Terms and Conditions, please contact us at support@petnow.com.</p>`,
        isActive: true,
    },
];
