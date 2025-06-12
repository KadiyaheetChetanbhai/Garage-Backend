import Stripe from 'stripe';
import dotenv from 'dotenv';
import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';
import Service from '../models/service.model.js';
import Garage from '../models/garage.model.js';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId)
            .populate('customerId', 'name email')
            .populate('garageId', 'name')
            .populate('serviceIds', 'name price');

        if (!booking) {
            throw new Error('Booking not found');
        }

        // Create a payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(booking.totalAmount * 100), // Stripe uses cents
            currency: 'usd',
            metadata: {
                bookingId: booking._id.toString(),
                customerId: booking.customerId._id.toString(),
                garageId: booking.garageId._id.toString(),
            },
            receipt_email: booking.customerId.email,
            description: `Garage services at ${booking.garageId.name}`,
        });

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
};

export const confirmPayment = async (bookingId, paymentIntentId) => {
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Verify payment status with Stripe
        const paymentIntent =
            await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Update booking payment status
            booking.paymentStatus = 'completed';
            await booking.save();

            return {
                success: true,
                paymentStatus: 'completed',
            };
        } else {
            return {
                success: false,
                paymentStatus: paymentIntent.status,
            };
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        throw error;
    }
};

export const generateInvoice = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId)
            .populate('customerId', 'name email')
            .populate('garageId', 'name address phone')
            .populate('serviceIds', 'name price duration');

        if (!booking) {
            throw new Error('Booking not found');
        }

        // Create an invoice with Stripe
        const customer = await stripe.customers.create({
            name: booking.customerId.name,
            email: booking.customerId.email,
        });

        const invoice = await stripe.invoices.create({
            customer: customer.id,
            collection_method: 'send_invoice',
            days_until_due: 30,
        });

        // Add line items for each service
        for (const service of booking.serviceIds) {
            await stripe.invoiceItems.create({
                customer: customer.id,
                invoice: invoice.id,
                amount: Math.round(service.price * 100),
                currency: 'usd',
                description: service.name,
            });
        }

        // If pickup/drop is opted
        if (booking.pickupDrop.opted) {
            await stripe.invoiceItems.create({
                customer: customer.id,
                invoice: invoice.id,
                amount: 1500, // $15 for pickup/drop
                currency: 'usd',
                description: 'Pickup and Drop Service',
            });
        }

        // Finalize the invoice
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(
            invoice.id,
        );

        // Send the invoice
        await stripe.invoices.sendInvoice(finalizedInvoice.id);

        // Update booking with invoice URL
        booking.invoiceUrl = finalizedInvoice.hosted_invoice_url;
        await booking.save();

        return {
            invoiceUrl: finalizedInvoice.hosted_invoice_url,
            invoicePdf: finalizedInvoice.invoice_pdf,
        };
    } catch (error) {
        console.error('Error generating invoice:', error);
        throw error;
    }
};

export const processRefund = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Retrieve the payment intent from booking metadata
        const payments = await stripe.paymentIntents.search({
            query: `metadata['bookingId']:'${bookingId}'`,
        });

        if (payments.data.length === 0) {
            throw new Error('No payment found for this booking');
        }

        const paymentIntent = payments.data[0];

        // Process refund
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntent.id,
        });

        // Update booking status
        booking.paymentStatus = 'refunded';
        await booking.save();

        return {
            success: true,
            refundId: refund.id,
            status: refund.status,
        };
    } catch (error) {
        console.error('Error processing refund:', error);
        throw error;
    }
};
