import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  imagePublicId: {
    type: String,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  aiDescription: {
    type: String,
    default: ''
  },
  upsellSuggestion: {
    type: String,
    default: ''
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }
}, {
  timestamps: true
});

menuItemSchema.index({ categoryId: 1 });

export default mongoose.model('MenuItem', menuItemSchema);
