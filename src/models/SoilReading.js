const mongoose = require('mongoose');

const soilReadingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  nitrogen: { type: Number, required: true, min: 0, max: 200 },
  phosphorus: { type: Number, required: true, min: 0, max: 200 },
  potassium: { type: Number, required: true, min: 0, max: 200 },
  temperature: { type: Number, required: true, min: 0, max: 60 },
  humidity: { type: Number, required: true, min: 0, max: 100 },
  ph: { type: Number, required: true, min: 0, max: 14 },
  rainfall: { type: Number, required: true, min: 0, max: 500 },
  result: {
    recommendations: [{
      crop: { type: String },
      confidence: { type: Number, min: 0, max: 100 },
      fertilizers: [{
        name: String,
        dosage: String,
        timing: String
      }],
      growingTips: [String]
    }],
    topCrop: { type: String },
    allConfidences: { type: Map, of: Number }
  },
  notes: { type: String, default: '' },
  isBookmarked: { type: Boolean, default: false }
}, { timestamps: true });

soilReadingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SoilReading', soilReadingSchema);
