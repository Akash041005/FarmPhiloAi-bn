const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  commonNames: [{ type: String, trim: true }],
  cropType: { type: String, required: true, trim: true, index: true },
  description: { type: String },
  symptoms: [{ type: String, trim: true }],
  causes: [{ type: String, trim: true }],
  severity: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    default: 'moderate'
  },
  treatment: [{
    step: Number,
    instruction: String,
    estimated_time: String,
    method: { type: String, enum: ['organic', 'chemical', 'preventive'] }
  }],
  fertilizers: [{
    name: String,
    type: { type: String, enum: ['organic', 'chemical'] },
    dosage: String,
    timing: String,
    price: String
  }],
  prevention: [{ type: String, trim: true }],
  imageUrls: [String],
  seasonal: { type: String, enum: ['kharif', 'rabi', 'zaid', 'all'], default: 'all' },
  regions: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Disease', diseaseSchema);
