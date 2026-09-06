const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    name: { type: String, default: '' }
  },
  current: {
    temp: Number,
    feels_like: Number,
    humidity: Number,
    pressure: Number,
    description: String,
    icon: String,
    wind_speed: Number,
    cloudiness: Number,
    visibility: Number,
    sunrise: Number,
    sunset: Number
  },
  forecast: {
    hourly: [{
      dt: Number, temp: Number, humidity: Number,
      description: String, icon: String, pop: Number
    }],
    daily: [{
      dt: Number, temp_min: Number, temp_max: Number,
      humidity: Number, description: String, icon: String, pop: Number
    }]
  },
  agricultural_insights: {
    spray_conditions: {
      suitable: Boolean,
      best_time: String
    },
    irrigation_needed: Boolean,
    disease_risk: String,
    recommended_activities: [String]
  }
}, { timestamps: true });

weatherDataSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
weatherDataSchema.index({ createdAt: -1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('WeatherData', weatherDataSchema);
