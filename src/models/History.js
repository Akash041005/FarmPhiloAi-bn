const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  image: {
    url: {
      type: String,
      required: [true, 'Image URL is required']
    },
    publicId: {
      type: String,
      default: null
    },
    thumbnailUrl: {
      type: String,
      default: null
    }
  },
  cropType: {
    type: String,
    trim: true,
    default: 'Unknown'
  },
  result: {
    disease: {
      type: String,
      default: 'Unknown'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    severity: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      default: 'low'
    },
    causes: [{
      type: String,
      trim: true
    }],
    cure_steps: [{
      step: {
        type: Number,
        default: 0
      },
      instruction: {
        type: String,
        default: ''
      },
      estimated_time: {
        type: String,
        default: ''
      }
    }],
    fertilizers: [{
      name: {
        type: String,
        trim: true
      },
      dosage: {
        type: String,
        default: ''
      },
      timing: {
        type: String,
        default: ''
      },
      buy_link: {
        type: String,
        default: ''
      },
      price: {
        type: String,
        default: ''
      },
      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      }
    }],
    prevention: [{
      type: String,
      trim: true
    }],
    weather_advice: {
      type: String,
      default: ''
    },
    action_plan: {
      today: {
        type: String,
        default: ''
      },
      next_3_days: {
        type: String,
        default: ''
      },
      next_7_days: {
        type: String,
        default: ''
      }
    },
    ai_confidence_level: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    }
  },
  weather: {
    temperature: {
      type: Number,
      default: null
    },
    humidity: {
      type: Number,
      default: null
    },
    description: {
      type: String,
      default: ''
    },
    windSpeed: {
      type: Number,
      default: null
    },
    rainChance: {
      type: Number,
      default: null
    }
  },
  location: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    address: {
      type: String,
      default: ''
    }
  },
  voiceInput: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

historySchema.index({ userId: 1, createdAt: -1 });
historySchema.index({ cropType: 1 });
historySchema.index({ 'result.disease': 1 });
historySchema.index({ createdAt: -1 });

historySchema.methods.toJSON = function() {
  const history = this.toObject();
  delete history.__v;
  return history;
};

module.exports = mongoose.model('History', historySchema);