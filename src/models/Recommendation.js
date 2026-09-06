const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['crop', 'fertilizer', 'disease', 'weather'],
    required: true
  },
  soilReadingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SoilReading',
    default: null
  },
  historyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'History',
    default: null
  },
  input: {
    soilParams: {
      N: Number, P: Number, K: Number,
      temperature: Number, humidity: Number,
      pH: Number, rainfall: Number
    },
    cropType: String,
    imageUrl: String,
    voiceInput: String,
    query: String
  },
  result: {
    cropRecommendations: [{
      crop: String,
      confidence: Number,
      fertilizers: [{ name: String, dosage: String, timing: String }],
      growingTips: [String]
    }],
    diseaseInfo: {
      name: String,
      confidence: Number,
      severity: String
    },
    fertilizerAdvice: [{
      name: String,
      dosage: String,
      timing: String,
      price: String,
      rating: Number
    }],
    weatherAdvisory: String
  },
  aiModelUsed: {
    type: String,
    default: 'random-forest'
  },
  confidence: { type: Number, min: 0, max: 100, default: 0 },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    helpful: { type: Boolean },
    comment: { type: String }
  }
}, { timestamps: true });

recommendationSchema.index({ userId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
