const geminiService = require('../services/geminiService');
const weatherService = require('../services/weatherService');
const logger = require('../utils/logger');

const LANGUAGE_MAP = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  te: 'Telugu (తెలుగు)',
  ta: 'Tamil (தமிழ்)',
  kn: 'Kannada (ಕನ್ನಡ)',
  bn: 'Bengali (বাংলা)',
  mr: 'Marathi (मराठी)',
  gu: 'Gujarati (ગુજરાતી)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  or: 'Odia (ଓଡ଼ିଆ)'
};

const chat = async (req, res, next) => {
  try {
    const { message, language } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }
    const lang = language || req.user?.language || 'en';
    const targetLanguageName = LANGUAGE_MAP[lang] || 'English';

    let weatherData = null;
    if (req.user?.location?.latitude && req.user?.location?.longitude) {
      try {
        weatherData = await weatherService.getWeatherData(req.user.location.latitude, req.user.location.longitude);
      } catch (e) { /* non-critical */ }
    }

    const prompt = `You are a friendly, highly knowledgeable AI agricultural expert and crop doctor for Indian farmers. 

The farmer speaks in ${targetLanguageName}.
CRITICAL: You MUST write your reply directly in ${targetLanguageName} using its native script.

User message: "${message}"
User location: ${req.user?.location?.address || 'India'}
Current weather: ${JSON.stringify(weatherData || {})}

Provide clear, empathetic, and actionable farming advice. Use simple terms easily understood by farmers. If suggesting pesticides or fertilizers, mention dosages and safety tips.

Return ONLY a valid JSON object:
{
  "reply": "Your helpful response written completely in ${targetLanguageName}",
  "suggestions": ["Follow-up question 1 in ${targetLanguageName}", "Follow-up question 2 in ${targetLanguageName}", "Follow-up question 3 in ${targetLanguageName}"],
  "actions": [{"label": "Scan Crop", "route": "/scan"}],
  "language": "${lang}"
}`;

    const result = await geminiService.chatWithAI(prompt);
    res.status(200).json({
      success: true,
      reply: result.reply || (lang === 'hi' ? 'मैं आपकी खेती में मदद करने के लिए यहाँ हूँ!' : "I'm here to help with your farming questions!"),
      suggestions: result.suggestions || ['Tell me about my crops', 'Check weather', 'Disease advice'],
      actions: result.actions || [{ label: 'Scan Crop', route: '/scan' }],
      language: lang
    });
  } catch (error) {
    logger.error('Chatbot error:', error);
    const lang = req.body?.language || req.user?.language || 'en';
    res.status(200).json({
      success: true,
      reply: lang === 'hi' ? 'नमस्ते! मुझसे फसल, रोग, खाद या मौसम के बारे में पूछें।' : (lang === 'te' ? 'నమస్కారం! పంటలు లేదా ఎరువుల గురించి నన్ను అడగండి.' : "I'm here to help! Ask me about crops, diseases, weather, or farming tips."),
      suggestions: ['What crops to plant?', 'Check disease risk', 'Weather forecast'],
      actions: [{ label: 'Scan Crop', route: '/scan' }],
      language: lang
    });
  }
};

module.exports = { chat };
