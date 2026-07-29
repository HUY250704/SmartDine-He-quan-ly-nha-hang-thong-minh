import mongoose from 'mongoose';

const SupportRequestSchema = new mongoose.Schema(
  {
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    type: { type: String, enum: ['assistance', 'payment', 'question'], default: 'assistance' },
    message: { type: String, default: 'Customer needs assistance' },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

SupportRequestSchema.index({ status: 1 });
SupportRequestSchema.index({ tableId: 1 });
SupportRequestSchema.index({ createdAt: -1 });

export default mongoose.model('SupportRequest', SupportRequestSchema);
