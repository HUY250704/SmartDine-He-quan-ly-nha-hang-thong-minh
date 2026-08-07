import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    unique: true
  },
  tableNumber: {
    type: Number
  },
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    image: String
  }],
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  serviceCharge: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'E_WALLET'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'REFUNDED'],
    default: 'PAID'
  },
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  paidAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Bill', billSchema);
