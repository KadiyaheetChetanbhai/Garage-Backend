import { USER_TYPES } from '../constants/common.constant.js';

// SuperAdmin user
export const superAdmins = [
    {
        name: 'SuperAdmin',
        email: 'petnowadmin@yopmail.com',
        userType: USER_TYPES.SUPERADMIN,
        password: 'Pa$w0rd!',
        isEditable: false,
    },
];

// Regular users
export const users = [
    {
        name: 'John Smith',
        email: 'john.smith@example.com',
        userType: USER_TYPES.USER,
        password: 'User123!',
        isEditable: true,
    },
    {
        name: 'Emma Johnson',
        email: 'emma.j@example.com',
        userType: USER_TYPES.USER,
        password: 'User123!',
        isEditable: true,
    },
    {
        name: 'Michael Brown',
        email: 'michael.b@example.com',
        userType: USER_TYPES.USER,
        password: 'User123!',
        isEditable: true,
    },
];

// Garage admins
export const garageAdmins = [
    {
        name: 'Robert Garcia',
        email: 'robert.garage@example.com',
        userType: USER_TYPES.GARAGE_ADMIN,
        password: 'Garage123!',
        garageName: 'Quick Fix Auto',
        address: '123 Main Street, New York, NY 10001',
        contactNumber: '212-555-1234',
        isEditable: true,
    },
    {
        name: 'Sarah Johnson',
        email: 'sarah.garage@example.com',
        userType: USER_TYPES.GARAGE_ADMIN,
        password: 'Garage123!',
        garageName: 'Premium Auto Service',
        address: '456 Oak Avenue, Los Angeles, CA 90001',
        contactNumber: '323-555-6789',
        isEditable: true,
    },
];

// Sample garages
export const garages = [
    {
        name: 'Quick Fix Auto',
        address: '123 Main Street, New York, NY 10001',
        phone: '212-555-1234',
        pincode: '10001',
        mapLink: 'https://goo.gl/maps/example1',
        latitude: 40.7128,
        longitude: -74.006,
        website: 'https://quickfixauto.example.com',
        description:
            'Fast and reliable auto repair services for all makes and models',
        rating: 4.5,
        priceRange: {
            min: 50,
            max: 500,
        },
        images: ['garage1_img1.jpg', 'garage1_img2.jpg'],
        pickupDropAvailable: true,
        timeSlots: [
            { day: 'Monday', open: '08:00', close: '18:00', isClosed: false },
            { day: 'Tuesday', open: '08:00', close: '18:00', isClosed: false },
            {
                day: 'Wednesday',
                open: '08:00',
                close: '18:00',
                isClosed: false,
            },
            { day: 'Thursday', open: '08:00', close: '18:00', isClosed: false },
            { day: 'Friday', open: '08:00', close: '18:00', isClosed: false },
            { day: 'Saturday', open: '10:00', close: '16:00', isClosed: false },
            { day: 'Sunday', open: '', close: '', isClosed: true },
        ],
    },
    {
        name: 'Premium Auto Service',
        address: '456 Oak Avenue, Los Angeles, CA 90001',
        phone: '323-555-6789',
        pincode: '90001',
        mapLink: 'https://goo.gl/maps/example2',
        latitude: 34.0522,
        longitude: -118.2437,
        website: 'https://premiumauto.example.com',
        description: 'Luxury vehicle specialists with premium service options',
        rating: 4.8,
        priceRange: {
            min: 80,
            max: 1000,
        },
        images: ['garage2_img1.jpg', 'garage2_img2.jpg', 'garage2_img3.jpg'],
        pickupDropAvailable: true,
        timeSlots: [
            { day: 'Monday', open: '07:00', close: '19:00', isClosed: false },
            { day: 'Tuesday', open: '07:00', close: '19:00', isClosed: false },
            {
                day: 'Wednesday',
                open: '07:00',
                close: '19:00',
                isClosed: false,
            },
            { day: 'Thursday', open: '07:00', close: '19:00', isClosed: false },
            { day: 'Friday', open: '07:00', close: '19:00', isClosed: false },
            { day: 'Saturday', open: '09:00', close: '17:00', isClosed: false },
            { day: 'Sunday', open: '', close: '', isClosed: true },
        ],
    },
];

// Sample services
export const services = [
    {
        name: 'Oil Change',
        description: 'Standard oil change service with filter replacement',
        price: 49.99,
        duration: 45, // in minutes
        category: 'maintenance',
        image: 'oil-change.jpg',
        isActive: true,
    },
    {
        name: 'Brake Inspection',
        description: 'Complete brake system inspection and report',
        price: 69.99,
        duration: 60,
        category: 'inspection',
        image: 'brake-inspection.jpg',
        isActive: true,
    },
    {
        name: 'Tire Rotation',
        description: 'Tire rotation to ensure even wear and extend tire life',
        price: 39.99,
        duration: 30,
        category: 'maintenance',
        image: 'tire-rotation.jpg',
        isActive: true,
    },
    {
        name: 'Engine Diagnostics',
        description: 'Complete computer diagnostics to identify engine issues',
        price: 89.99,
        duration: 75,
        category: 'inspection',
        image: 'engine-diagnostics.jpg',
        isActive: true,
    },
];

// Sample transports
export const transports = [
    {
        vehicleType: 'van',
        vehicleName: 'Ford Transit',
        vehicleNumber: 'NYC-1234',
        capacity: 3,
        driverName: 'David Miller',
        driverContact: '212-555-9876',
        isActive: true,
        note: 'Available for pickup/drop services within 15 miles',
    },
    {
        vehicleType: 'car',
        vehicleName: 'Toyota Camry',
        vehicleNumber: 'LA-5678',
        capacity: 2,
        driverName: 'James Wilson',
        driverContact: '323-555-4321',
        isActive: true,
        note: 'Luxury sedan for customer transport',
    },
];

// Sample blogs
export const blogs = [
    {
        title: 'Top 10 Car Maintenance Tips for Summer',
        content: `<h1>Top 10 Car Maintenance Tips for Summer</h1>
        <p>Summer heat can put additional strain on your vehicle. Here are our top maintenance tips to keep your car running smoothly during the hot months.</p>
        <h2>1. Check Your Air Conditioning</h2>
        <p>Ensure your A/C is working properly before temperatures soar...</p>
        <h2>2. Monitor Coolant Levels</h2>
        <p>Overheating is a common summer problem. Regularly check your coolant levels...</p>
        <h2>3. Inspect Tires</h2>
        <p>Hot pavement can lead to faster tire wear and blowouts...</p>`,
        category: 'maintenance',
        tags: ['summer', 'maintenance', 'cooling', 'tires'],
        status: 'published',
        metaTitle: 'Essential Summer Car Maintenance Tips',
        metaDescription:
            'Learn how to keep your car in top condition during hot summer months with these essential maintenance tips.',
    },
    {
        title: 'Understanding Your Check Engine Light',
        content: `<h1>Understanding Your Check Engine Light</h1>
        <p>The check engine light can indicate various issues from minor to serious. Here's what you need to know.</p>
        <h2>What Does It Mean When It's On?</h2>
        <p>A solid check engine light typically means...</p>
        <h2>What Does It Mean When It's Flashing?</h2>
        <p>A flashing check engine light indicates...</p>
        <h2>Common Causes</h2>
        <p>The most frequent reasons for a check engine light include...</p>`,
        category: 'tips',
        tags: ['check engine', 'diagnostics', 'warning lights'],
        status: 'published',
        metaTitle: 'What Your Check Engine Light Is Trying to Tell You',
        metaDescription:
            'Learn to decode what your check engine light means and what steps to take when it appears.',
    },
];

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
