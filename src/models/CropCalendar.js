const mongoose = require('mongoose');

const cropCalendarSchema = new mongoose.Schema({
  crop: { type: String, required: true, trim: true },
  season: {
    type: String,
    enum: ['kharif', 'rabi', 'zaid'],
    required: true
  },
  region: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  sowingStart: { type: String, required: true },
  sowingEnd: { type: String, required: true },
  harvestingStart: { type: String, required: true },
  harvestingEnd: { type: String, required: true },
  duration: { type: Number },
  growingTips: [{ type: String }],
  waterRequirement: { type: String, enum: ['low', 'medium', 'high'] },
  soilType: [{ type: String }],
  temperature: {
    min: { type: Number },
    max: { type: Number }
  },
  rainfall: {
    min: { type: Number },
    max: { type: Number }
  },
  festivals: [{
    name: String,
    date: String,
    description: String
  }],
  alerts: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

cropCalendarSchema.index({ crop: 1, season: 1, region: 1, state: 1 });

module.exports = mongoose.model('CropCalendar', cropCalendarSchema);
