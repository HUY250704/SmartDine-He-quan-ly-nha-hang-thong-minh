import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'CLOSED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

sessionSchema.index({ tableId: 1, status: 1 });

export default mongoose.model('Session', sessionSchema);
