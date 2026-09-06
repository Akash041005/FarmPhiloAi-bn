const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'User ID is required'] },
  type: { type: String, enum: ['disease_alert', 'weather_alert', 'tip', 'reminder', 'disaster_alert'], required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  language: { type: String, enum: ['en', 'hi', 'te'], default: 'en' },
  data: {
    historyId: { type: mongoose.Schema.Types.ObjectId, ref: 'History' },
    disease: String,
    weatherCondition: String,
    disasterType: String,
    severityLevel: String,
    emergencyActions: [String],
    location: String
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  read: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now },
  readAt: Date
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
