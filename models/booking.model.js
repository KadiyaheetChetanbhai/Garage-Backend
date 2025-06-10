import mongoose from 'mongoose';


const bookingSchema =new mongoose.Schema({
    customerId: { type:  mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    garageId: { type:  mongoose.Schema.Types.ObjectId, required: true, ref: 'Garage' },
    serviceIds: [{ type:  mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }],
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, 
    pickupDrop: {
        opted: { type: Boolean, default: false },
        pickupAddress: { type: String },
        dropAddress: { type: String }
    },
    transportPartnerId: { type:  mongoose.Schema.Types.ObjectId, ref: 'TransportPartner' },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
        default: 'pending' 
    },
    invoiceUrl: { type: String },
    reminderSent: {
        oneHour: { type: Boolean, default: false },
        twentyFourHour: { type: Boolean, default: false }
    }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const booking = mongoose.model('booking', bookingSchema);
export default booking;