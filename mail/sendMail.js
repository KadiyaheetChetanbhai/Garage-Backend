import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import path from 'path';
import hbs from 'nodemailer-express-handlebars';
import { EMAIL_COMMON_DATA } from '../constants/common.constant.js';
import { htmlToText } from 'html-to-text';
import fs from 'fs/promises';
import Handlebars from 'handlebars';
import crypto from 'crypto';
import logger from '../helpers/logger.helper.js';
import { existsSync } from 'fs';

// Constants
const EMAIL_TYPES = Object.freeze({
    resetPassword: ['otp', 'expiresIn'],
    accountCreated: ['name', 'email', 'password'],
    // Add new email types for booking system
    bookingConfirmation: [
        'name',
        'bookingId',
        'garageName',
        'garageAddress',
        'garagePhone',
        'date',
        'time',
        'services',
        'totalAmount',
        'pickupDropService',
        'dashboardUrl',
    ],
    bookingStatusUpdate: [
        'name',
        'bookingId',
        'garageName',
        'status',
        'statusMessage',
        'date',
        'notes',
        'dashboardUrl',
    ],
    serviceCompleted: [
        'name',
        'bookingId',
        'garageName',
        'date',
        'notes',
        'reviewLink',
        'dashboardUrl',
    ],
    bookingReminder: [
        'name',
        'garageName',
        'reminderTime',
        'date',
        'time',
        'address',
        'phone',
        'pickupDropService',
        'pickupAddress',
        'dashboardUrl',
        'cancelUrl',
    ],
    newReview: [
        'name',
        'garageName',
        'rating',
        'comment',
        'date',
        'dashboardUrl',
    ],
    newBookingNotification: [
        'name',
        'customerName',
        'customerEmail',
        'bookingId',
        'date',
        'time',
        'services',
        'totalAmount',
        'dashboardUrl',
    ],
});

const SPAM_TRIGGERS = Object.freeze([
    { pattern: /\bfree\s+offer\b/gi, replacement: 'complimentary service' },
    { pattern: /\bact\s+now\b/gi, replacement: 'respond soon' },
    {
        pattern: /\blimited\s+time\s+offer\b/gi,
        replacement: 'time-sensitive opportunity',
    },
    { pattern: /\bcash\b/gi, replacement: 'funds' },
    { pattern: /\bmake\s+money\b/gi, replacement: 'increase revenue' },
    { pattern: /\b100%\s+free\b/gi, replacement: 'no cost' },
    { pattern: /\bguaranteed\b/gi, replacement: 'assured' },
]);

const HTML_TO_TEXT_OPTIONS = Object.freeze({
    wordwrap: 80,
    selectors: [
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
        { selector: 'img', format: 'skip' },
    ],
});

// State variables
const emailQueue = [];
let isProcessing = false;
let transporter = null;
let templateDir = '';

/**
 * Generates a unique Message-ID for emails
 * @param {string} domain - Email domain
 * @returns {string} Formatted message ID
 */
const generateMessageId = (domain) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    return `<${timestamp}.${random}@${domain}>`;
};

/**
 * Creates a hash of email content for tracking
 * @param {string} content - Email content
 * @returns {string} Content hash
 */
const createContentHash = (content) => {
    return crypto
        .createHash('sha256')
        .update(content)
        .digest('hex')
        .substring(0, 12);
};

/**
 * Validates that required fields are present in email data
 * @param {string} type - Email type
 * @param {Object} data - Email data
 * @throws {Error} If required fields are missing
 */
const validatePayload = (type, data) => {
    const requiredFields = EMAIL_TYPES[type];
    if (!requiredFields) throw new Error(`Unknown email type: ${type}`);

    const missing = requiredFields.filter((f) => !(f in data));
    if (missing.length) {
        throw new Error(`Missing fields: ${missing.join(', ')}`);
    }
};

/**
 * Sets up the email transporter with configuration
 * @returns {Object} Configured nodemailer transporter
 */
const setupTransporter = () => {
    if (transporter) return transporter;

    // Parse domain from email for Message-ID and DKIM
    // const emailDomain = process.env.MAIL_EMAIL ? process.env.MAIL_EMAIL.split('@')[1] : 'example.com';

    // Configure nodemailer with DKIM if available
    const transportOptions = {
        service: process.env.MAIL_SERVICE_PROVIDER,
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAIL_EMAIL,
            pass: process.env.MAIL_PASSWORD,
        },
    };

    // Add DKIM configuration if available
    if (process.env.DKIM_PRIVATE_KEY && process.env.DKIM_DOMAIN_NAME) {
        transportOptions.dkim = {
            domainName: process.env.DKIM_DOMAIN_NAME,
            keySelector: process.env.DKIM_SELECTOR || 'default',
            privateKey: process.env.DKIM_PRIVATE_KEY,
        };
    }

    transporter = nodemailer.createTransport(transportOptions);

    // Set up template directory once
    if (!templateDir) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        templateDir = path.resolve(__dirname, './templates');
    }

    transporter.use(
        'compile',
        hbs({
            viewEngine: {
                extName: '.handlebars',
                layoutsDir: templateDir,
                defaultLayout: false,
            },
            viewPath: templateDir,
            extName: '.handlebars',
        }),
    );

    return transporter;
};

/**
 * Converts HTML content to plain text
 * @param {string} html - HTML content
 * @returns {string} Plain text version
 */
const generateTextVersion = async (html) => {
    return htmlToText(html, HTML_TO_TEXT_OPTIONS);
};

/**
 * Renders a Handlebars template with provided data
 * @param {string} templatePath - Path to template file
 * @param {Object} data - Data to render in template
 * @returns {string} Rendered HTML
 */
const renderHandlebarsTemplate = async (templatePath, data) => {
    try {
        // Get the directory of the template
        const templateDir = path.dirname(templatePath);

        // Register the base template as a partial
        const baseTemplatePath = path.join(templateDir, 'base.handlebars');
        const baseTemplateContent = await fs.readFile(baseTemplatePath, 'utf8');
        Handlebars.registerPartial('base', baseTemplateContent);

        // Register date formatting helper
        Handlebars.registerHelper('formatDate', function (date) {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        });

        // Load and compile the requested template
        const templateContent = await fs.readFile(templatePath, 'utf8');
        const template = Handlebars.compile(templateContent);

        return template(data);
    } catch (error) {
        logger.error('Template rendering error:', error);
        throw error;
    }
};

/**
 * Sanitizes HTML content to remove potential spam triggers
 * @param {string} html - HTML content
 * @returns {string} Sanitized HTML
 */
const sanitizeHtmlContent = (html) => {
    // Remove excessive exclamation marks
    let sanitized = html.replace(/!{2,}/g, '!');

    // Remove all caps words (often flagged as spam)
    sanitized = sanitized.replace(
        /\b[A-Z]{4,}\b/g,
        (match) => match.charAt(0) + match.slice(1).toLowerCase(),
    );

    // Replace common spam trigger phrases
    SPAM_TRIGGERS.forEach(({ pattern, replacement }) => {
        sanitized = sanitized.replace(pattern, replacement);
    });

    return sanitized;
};

/**
 * Creates standard email headers
 * @param {string} domain - Email domain
 * @param {string} senderEmail - Sender email address
 * @param {string} type - Email type
 * @returns {Object} Email headers
 */
const createStandardHeaders = (domain, senderEmail, type) => {
    const headers = {
        // Standard headers to avoid spam flags
        Precedence: 'bulk',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Auto-Submitted': 'auto-generated',
        'X-Mailer': 'PetNow Mailer System 1.0',
        'Return-Path': process.env.BOUNCE_EMAIL || senderEmail,
        'X-Report-Abuse': `Please report abuse to ${process.env.ABUSE_EMAIL || 'abuse@' + domain}`,
        'X-Original-Authentication-Results': `dkim=pass (signature verified) header.d=${domain}`,
        'X-Entity-Ref-ID': crypto.randomBytes(16).toString('hex'),
    };

    // Add List headers for newsletter-type emails
    if (
        type === 'subscribeConfirmation' ||
        type === 'unsubscribeConfirmation' ||
        type.includes('newsletter')
    ) {
        headers['List-ID'] = `<${type}.${domain}>`;
        headers['Feedback-ID'] =
            `${type}:${process.env.MAIL_CAMPAIGN_ID || 'petnow'}`;
    }

    return headers;
};

/**
 * Processes the email queue
 */
const processQueue = async () => {
    if (isProcessing) return;
    isProcessing = true;

    while (emailQueue.length) {
        const { to, subject, type, data } = emailQueue.shift();

        try {
            const transporter = setupTransporter();

            // Extract domain from sender email for Message-ID
            const senderEmail = process.env.MAIL_EMAIL || 'noreply@example.com';
            const domain = senderEmail.split('@')[1];

            // Create unique messageId for this email
            const messageId = generateMessageId(domain);

            // Create email options with enhanced headers
            const mailOptions = {
                from: {
                    name: process.env.MAIL_FROM_NAME || 'Vehical Wellness Team',
                    address: senderEmail,
                },
                to,
                subject,
                messageId,
                headers: createStandardHeaders(domain, senderEmail, type),
                attachments: [],
            };

            // Add logo attachment if the file exists
            const logoPath = path.resolve(
                process.cwd(),
                'public/PetNowLogo.png',
            );
            if (existsSync(logoPath)) {
                mailOptions.attachments.push({
                    filename: 'PetNowLogo.png',
                    path: logoPath,
                    cid: 'pet11logo',
                });
            } else {
                logger.warn('Logo file not found at: ' + logoPath);
            }

            // Add unsubscribe options for newsletter emails
            if (
                type === 'subscribeConfirmation' ||
                type === 'unsubscribeConfirmation' ||
                type.includes('newsletter')
            ) {
                // Generate unsubscribe URL and email
                const unsubscribeUrl =
                    data.unsubscribeUrl ||
                    `${process.env.FRONTEND_URL}/unsubscribe/${Buffer.from(to).toString('base64')}`;
                const unsubscribeEmail =
                    process.env.UNSUBSCRIBE_EMAIL || process.env.MAIL_EMAIL;

                // Add List-Unsubscribe headers
                mailOptions.headers['List-Unsubscribe'] =
                    `<mailto:${unsubscribeEmail}?subject=Unsubscribe&body=Please unsubscribe me from the newsletter>, <${unsubscribeUrl}>`;
                mailOptions.headers['List-Unsubscribe-Post'] =
                    'List-Unsubscribe=One-Click';
            }

            // Render the template
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const templatePath = path.resolve(
                __dirname,
                `./templates/${type}.handlebars`,
            );

            try {
                // Render the template with our ESM-compatible renderer
                const mergedData = { ...data, ...EMAIL_COMMON_DATA };
                let html = await renderHandlebarsTemplate(
                    templatePath,
                    mergedData,
                );

                // Sanitize the HTML content to remove potential spam triggers
                html = sanitizeHtmlContent(html);

                // Convert HTML to text
                const textContent = await generateTextVersion(html);

                // Add both HTML and text versions
                mailOptions.html = html;
                mailOptions.text = textContent;

                // Create a hash of the content for tracking
                mailOptions.headers['X-Content-ID'] = createContentHash(html);
            } catch (renderErr) {
                logger.error(
                    'Error rendering template for text conversion:',
                    renderErr,
                );
                // Fallback to basic text if rendering fails
                mailOptions.text =
                    `Hello ${data.name || 'there'},\n\n` +
                    `This is a message from PetNow regarding ${type}.\n\n` +
                    `For better viewing experience, please use an email client that supports HTML emails.\n\n` +
                    `Best regards,\nPetNow Team`;
            }

            await transporter.sendMail(mailOptions);
        } catch (err) {
            logger.error(`Email failed for ${to}:`, err.message);
        }
    }

    isProcessing = false;
};

/**
 * Queues an email to be sent
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.type - Email type
 * @param {Object} options.data - Email data
 */
export const sendMail = ({ to, subject, type, data }) => {
    if (!to || !subject || !type || !data) {
        throw new Error('To, Subject, Type and data are required');
    }
    validatePayload(type, data);
    emailQueue.push({ to, subject, type, data });
    processQueue();
};
