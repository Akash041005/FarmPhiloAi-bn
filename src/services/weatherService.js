const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const getCurrentWeather = async (lat, lon) => {
  try {
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch weather data');
    }

    return {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      main: data.weather[0].main,
      icon: data.weather[0].icon,
      wind_speed: Math.round(data.wind.speed * 3.6),
      wind_deg: data.wind.deg,
      cloudiness: data.clouds.all,
      visibility: data.visibility,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      timezone: data.timezone,
      name: data.name
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    throw new Error('Failed to fetch current weather');
  }
};

const getForecast = async (lat, lon) => {
  try {
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch forecast data');
    }

    const hourly = data.list.slice(0, 8).map(item => ({
      dt: item.dt,
      temp: Math.round(item.main.temp),
      feels_like: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      description: item.weather[0].description,
      main: item.weather[0].main,
      icon: item.weather[0].icon,
      wind_speed: Math.round(item.wind.speed * 3.6),
      pop: Math.round(item.pop * 100),
      rain: item.rain ? item.rain['3h'] : 0
    }));

    const daily = [];
    const addedDays = new Set();
    
    for (const item of data.list) {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!addedDays.has(date) && daily.length < 7) {
        addedDays.add(date);
        daily.push({
          dt: item.dt,
          temp_min: Math.round(item.main.temp_min),
          temp_max: Math.round(item.main.temp_max),
          humidity: item.main.humidity,
          description: item.weather[0].description,
          main: item.weather[0].main,
          icon: item.weather[0].icon,
          wind_speed: Math.round(item.wind.speed * 3.6),
          pop: Math.round(item.pop * 100),
          rain: item.rain ? item.rain['3h'] : 0
        });
      }
    }

    return { hourly, daily };
  } catch (error) {
    console.error('Forecast API Error:', error);
    throw new Error('Failed to fetch forecast data');
  }
};

const getAgriculturalInsights = async (weather, forecast) => {
  try {
    const currentTemp = weather.temp;
    const humidity = weather.humidity;
    const rainChance = forecast.daily[0]?.pop || 0;
    const windSpeed = weather.wind_speed;

    let sprayConditions = { suitable: false, best_time: '' };
    let irrigationNeeded = false;
    let diseaseRisk = 'low';
    let recommendedActivities = [];

    if (humidity > 70 && currentTemp >= 20 && currentTemp <= 30) {
      diseaseRisk = 'high';
      recommendedActivities.push('High fungal disease risk - inspect crops daily');
    } else if (humidity > 50 && currentTemp >= 25 && currentTemp <= 35) {
      diseaseRisk = 'moderate';
      recommendedActivities.push('Moderate disease risk - monitor regularly');
    } else {
      diseaseRisk = 'low';
      recommendedActivities.push('Low disease risk - maintain routine care');
    }

    if (rainChance > 60) {
      sprayConditions = { suitable: false, best_time: '' };
      recommendedActivities.push('Avoid spraying - rain expected');
      irrigationNeeded = false;
    } else if (rainChance > 30) {
      sprayConditions = { suitable: true, best_time: 'Morning (6AM-8AM)' };
      irrigationNeeded = false;
    } else if (humidity < 40 && currentTemp > 30) {
      irrigationNeeded = true;
      recommendedActivities.push('High evapotranspiration - irrigate early morning or evening');
    } else {
      sprayConditions = { suitable: true, best_time: 'Morning (6AM-10AM) or Evening (4PM-6PM)' };
      recommendedActivities.push('Good conditions for foliar applications');
    }

    if (windSpeed > 30) {
      recommendedActivities.push('High wind - avoid spraying and harvesting');
      sprayConditions = { suitable: false, best_time: '' };
    } else if (windSpeed > 20) {
      recommendedActivities.push('Moderate wind - use care when spraying');
    }

    if (currentTemp > 35) {
      recommendedActivities.push('High temperature - provide shade for sensitive crops');
    } else if (currentTemp < 10) {
      recommendedActivities.push('Low temperature - protect frost-sensitive crops');
    }

    return {
      spray_conditions: sprayConditions,
      irrigation_needed: irrigationNeeded,
      disease_risk: diseaseRisk,
      recommended_activities: recommendedActivities
    };
  } catch (error) {
    console.error('Agricultural Insights Error:', error);
    return {
      spray_conditions: { suitable: true, best_time: 'Morning' },
      irrigation_needed: false,
      disease_risk: 'low',
      recommended_activities: ['Maintain routine crop care']
    };
  }
};

const getWeatherData = async (lat, lon) => {
  try {
    const [current, forecast] = await Promise.all([
      getCurrentWeather(lat, lon),
      getForecast(lat, lon)
    ]);

    const agriculturalInsights = await getAgriculturalInsights(current, forecast);

    return {
      current,
      forecast,
      agricultural_insights: agriculturalInsights
    };
  } catch (error) {
    console.error('Weather Data Error:', error);
    throw error;
  }
};

module.exports = {
  getCurrentWeather,
  getForecast,
  getAgriculturalInsights,
  getWeatherData
};