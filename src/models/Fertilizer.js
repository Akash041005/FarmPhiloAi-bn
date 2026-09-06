const mongoose = require('mongoose');

const fertilizerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  type: {
    type: String,
    enum: ['organic', 'chemical', 'biofertilizer'],
    required: true
  },
  nutrientContent: {
    nitrogen: { type: Number, default: 0 },
    phosphorus: { type: Number, default: 0 },
    potassium: { type: Number, default: 0 }
  },
  suitableCrops: [{ type: String, trim: true }],
  dosage: {
    base: { type: String },
    instructions: { type: String }
  },
  application: {
    method: { type: String, enum: ['soil', 'foliar', 'drip', 'seed treatment'] },
    timing: { type: String },
    frequency: { type: String }
  },
  price: {
    min: { type: Number },
    max: { type: Number },
    unit: { type: String, default: 'kg' }
  },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  buyLinks: [{
    platform: String,
    url: String
  }],
  organic: { type: Boolean, default: false },
  description: { type: String },
  precautions: [String],
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

fertilizerSchema.index({ type: 1 });

module.exports = mongoose.model('Fertilizer', fertilizerSchema);
