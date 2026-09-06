const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');
const weatherService = require('./weatherService');
const logger = require('../utils/logger');

/**
 * Evaluates weather conditions for disaster / emergency risks
 */
const detectDisasterConditions = (weatherData, locationName = 'Your Area') => {
  if (!weatherData || !weatherData.current) return null;

  const { temp, humidity, wind_speed, weather_id, description } = weatherData.current;
  const rainVol = weatherData.current.rain_1h || weatherData.forecast?.daily?.[0]?.rain || 0;
  const desc = (description || '').toLowerCase();

  // 1. FLOOD & TORRENTIAL RAIN DETECTION
  if (
    rainVol >= 40 ||
    [502, 503, 504, 522].includes(weather_id) ||
    desc.includes('torrential') ||
    desc.includes('extreme rain') ||
    desc.includes('flood') ||
    desc.includes('heavy intensity rain')
  ) {
    return {
      disasterType: 'FLOOD & EXTREME RAINFALL',
      priority: 'critical',
      title: `HIGH RED ALERT: Severe Flood & Extreme Rain Warning`,
      message: `Torrential rainfall (${rainVol.toFixed(1)}mm) detected in ${locationName}. Severe flooding and waterlogging risk in farmland.`,
      emergencyActions: [
        'Immediately open farm drainage channels and trenches to release excess water.',
        'Postpone all fertilizer applications and pesticide spraying immediately.',
        'Move harvested produce, nursery trays, and electric motor pumps to elevated platforms.',
        'Stake tall crops (banana, papaya, tomato) to prevent lodging.'
      ]
    };
  }

  // 2. CYCLONE & HIGH GALE WIND DETECTION
  if (wind_speed >= 16.6 || desc.includes('squall') || desc.includes('cyclone') || desc.includes('tornado')) {
    const kmh = (wind_speed * 3.6).toFixed(0);
    return {
      disasterType: 'CYCLONIC STORM & GALE WINDS',
      priority: 'critical',
      title: `HIGH RED ALERT: Destructive Wind & Storm Alert (${kmh} km/h)`,
      message: `Dangerous wind gusts (${kmh} km/h) recorded near ${locationName}. High risk of crop uprooting and polyhouse damage.`,
      emergencyActions: [
        'Secure greenhouse polyhouse sheets and net house structures.',
        'Tie and provide earth-up support to sugarcane, maize, and horticultural fruit trees.',
        'Clear tree branches near farm electrical transformers and power lines.',
        'Keep farm machinery and livestock inside protected sheds.'
      ]
    };
  }

  // 3. EXTREME HEATWAVE DETECTION
  if (temp >= 42 || desc.includes('heatwave')) {
    return {
      disasterType: 'EXTREME HEATWAVE',
      priority: 'high',
      title: `HIGH ALERT: Severe Heatwave Advisory (${temp.toFixed(1)}°C)`,
      message: `Extreme temperatures of ${temp.toFixed(1)}°C in ${locationName}. High evapotranspiration and flower drop risk.`,
      emergencyActions: [
        'Apply light and frequent micro-irrigation or drip irrigation during early morning or late evening.',
        'Use straw or organic mulch across crop beds to retain soil moisture.',
        'Spray anti-transpirants or kaolin clay spray (3-5%) to mitigate heat burn.',
        'Provide shade netting for sensitive vegetables and seedling nurseries.'
      ]
    };
  }

  // 4. FROST & EXTREME COLD DETECTION
  if (temp <= 4) {
    return {
      disasterType: 'SEVERE FROST & COLD WAVE',
      priority: 'high',
      title: `HIGH ALERT: Frost & Freezing Warning (${temp.toFixed(1)}°C)`,
      message: `Critical low temperature (${temp.toFixed(1)}°C) in ${locationName}. Severe freezing injury risk for standing crops.`,
      emergencyActions: [
        'Irrigate field in late afternoon to raise soil temperature overnight.',
        'Burn dry weeds or create smoke on windward field borders to prevent frost settlement.',
        'Cover valuable horticultural plants and nurseries with thatch or polythene sheets.'
      ]
    };
  }

  return null;
};

/**
 * Evaluates and sends routine 2-hour weather updates and emergency alerts
 */
const runWeatherAlertCheck = async () => {
  logger.info('[CronService] Running 2-Hour Weather & Disaster Evaluation...');
  try {
    const users = await User.find({ isActive: true });
    if (!users || users.length === 0) {
      logger.info('[CronService] No active users to process.');
      return { processed: 0, alertsCreated: 0 };
    }

    let alertsCreated = 0;

    for (const user of users) {
      const lat = user.location?.latitude || 17.3850; // Default to Hyderabad agri zone if location unset
      const lon = user.location?.longitude || 78.4867;
      const locationName = user.location?.address || 'Your Farmland';

      try {
        const weatherData = await weatherService.getWeatherData(lat, lon);
        if (!weatherData || !weatherData.current) continue;

        const disaster = detectDisasterConditions(weatherData, locationName);

        if (disaster) {
          // Create Critical Disaster Red Alert
          await Notification.create({
            userId: user._id,
            type: 'disaster_alert',
            priority: disaster.priority,
            title: disaster.title,
            message: disaster.message,
            language: user.language || 'en',
            data: {
              weatherCondition: weatherData.current.description,
              disasterType: disaster.disasterType,
              severityLevel: 'RED_ALERT',
              emergencyActions: disaster.emergencyActions,
              location: locationName
            }
          });
          alertsCreated++;
          logger.warn(`[CronService] RED ALERT created for user ${user.email}: ${disaster.title}`);
        } else {
          // Create Routine 2-Hour Agricultural Weather Update
          const temp = weatherData.current.temp;
          const humidity = weatherData.current.humidity;
          const rainChance = (weatherData.forecast?.daily?.[0]?.pop || 0) * 100;
          const sprayAdvice = weatherData.agricultural_insights?.spray_conditions?.suitable 
            ? 'Optimal window for crop spray.' 
            : 'Avoid spraying due to weather conditions.';

          await Notification.create({
            userId: user._id,
            type: 'weather_alert',
            priority: 'medium',
            title: `2-Hour Weather Update (${temp.toFixed(0)}°C, ${weatherData.current.description})`,
            message: `Current conditions: ${temp.toFixed(1)}°C, Humidity ${humidity}%, Rain chance ${rainChance.toFixed(0)}%. ${sprayAdvice}`,
            language: user.language || 'en',
            data: {
              weatherCondition: weatherData.current.description,
              location: locationName
            }
          });
          alertsCreated++;
        }
      } catch (userErr) {
        logger.warn(`[CronService] Error evaluating weather for user ${user.email}: ${userErr.message}`);
      }
    }

    logger.info(`[CronService] 2-Hour check completed. Processed ${users.length} users, created ${alertsCreated} notifications.`);
    return { processed: users.length, alertsCreated };
  } catch (error) {
    logger.error('[CronService] Error running weather alert check:', error);
    return { error: error.message };
  }
};

/**
 * Creates a simulated high-priority disaster red alert for testing / demonstration
 */
const triggerTestDisasterAlert = async (userId, customType = 'flood') => {
  const disasterPresets = {
    flood: {
      disasterType: 'FLASH FLOOD & CLOUDBURST',
      title: 'HIGH RED ALERT: Flash Flood & Heavy Inundation Warning',
      message: 'Severe cloudburst (65mm rain/hr) reported in your agricultural sector. High flood inundation and root rot danger.',
      emergencyActions: [
        'Drain waterlogged fields immediately through perimeter outflow trenches.',
        'Cut off irrigation supply valves and raise pump equipment.',
        'Apply copper oxychloride (3g/L) drenching once water recedes to prevent fungal root wilt.',
        'Contact local Krishi Vigyan Kendra (KVK) emergency helpline if damage persists.'
      ]
    },
    cyclone: {
      disasterType: 'CYCLONIC STORM & HURRICANE WINDS',
      title: 'HIGH RED ALERT: Severe Cyclone Warning (85 km/h Winds)',
      message: 'Severe cyclonic storm approaching your farm region with gale-force gusts up to 85 km/h.',
      emergencyActions: [
        'Secure greenhouse polyhouse sheets and dismantle shade nets to avoid structural collapse.',
        'Provide bamboo prop support to banana plants, papaya, and fruit trees.',
        'Harvest all mature fruits, vegetables, and grain crops immediately to minimize post-storm loss.',
        'Keep livestock in flood-proof masonry shelters.'
      ]
    },
    heatwave: {
      disasterType: 'EXTREME HEATWAVE (44.5°C)',
      title: 'HIGH RED ALERT: Severe Heatwave Emergency (44.5°C)',
      message: 'Dangerous heatwave conditions detected. Intense solar radiation and rapid soil desiccation.',
      emergencyActions: [
        'Operate sprinkler/drip systems during evening and night hours.',
        'Apply heavy straw mulch over root zones.',
        'Avoid foliar chemical sprays during peak daylight hours (10 AM - 4 PM).'
      ]
    }
  };

  const preset = disasterPresets[customType] || disasterPresets.flood;

  const notification = await Notification.create({
    userId,
    type: 'disaster_alert',
    priority: 'critical',
    title: preset.title,
    message: preset.message,
    language: 'en',
    data: {
      weatherCondition: 'Severe Emergency Alert',
      disasterType: preset.disasterType,
      severityLevel: 'RED_ALERT',
      emergencyActions: preset.emergencyActions,
      location: 'Farmland District'
    }
  });

  return notification;
};

/**
 * Starts the recurring 2-hour scheduler
 */
const startCronJobs = () => {
  // Run every 2 hours: At minute 0 of every 2nd hour (0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22)
  cron.schedule('0 */2 * * *', async () => {
    logger.info('[CronService] 2-Hour recurring cron triggered');
    await runWeatherAlertCheck();
  });

  logger.info('[CronService] 2-Hour Weather & Disaster Notification Cron initialized (0 */2 * * *)');
};

module.exports = {
  startCronJobs,
  runWeatherAlertCheck,
  triggerTestDisasterAlert,
  detectDisasterConditions
};
