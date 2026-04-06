const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retryWithBackoff, isRateLimitError } = require('../utils/rateLimitHandler');
const { getCachedAnalysis, cacheAnalysis } = require('./cacheService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const flashLiteModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
const flashModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const CONFIDENCE_THRESHOLD = 70;

const createAnalysisPrompt = (cropType, weatherData, location) => {
  return `You are an expert agricultural AI specializing in crop disease detection and farmer advisory. Analyze the provided crop image carefully.

CROP TYPE: ${cropType || 'Unknown crop'}
LOCATION: ${location || 'Unknown location'}
CURRENT WEATHER: ${JSON.stringify(weatherData || {})}

Analyze the image and provide a comprehensive disease analysis report. 

CRITICAL: Return ONLY a valid JSON object with no additional text. Use this exact structure:
{
  "disease": "Exact disease name or 'Healthy' if no disease detected",
  "confidence": 0-100 (number only),
  "severity": "low|moderate|high|critical",
  "causes": ["cause 1", "cause 2", "cause 3"],
  "cure_steps": [
    {"step": 1, "instruction": "First treatment step", "estimated_time": "e.g., 2-3 days"},
    {"step": 2, "instruction": "Second treatment step", "estimated_time": "e.g., 1 week"},
    {"step": 3, "instruction": "Third treatment step", "estimated_time": "e.g., 2 weeks"}
  ],
  "fertilizers": [
    {"name": "Fertilizer name", "dosage": "e.g., 50kg/acre", "timing": "e.g., Apply during flowering", "buy_link": "https://example.com/fertilizer", "price": "₹500-800", "rating": 4}
  ],
  "prevention": ["tip 1", "tip 2", "tip 3"],
  "weather_advice": "AI-generated advice based on current weather conditions",
  "action_plan": {
    "today": "What farmer should do TODAY",
    "next_3_days": "Action plan for next 3 days",
    "next_7_days": "Action plan for next 7 days"
  }
}

IMPORTANT: 
- If the crop looks healthy with no visible disease symptoms, return "disease": "Healthy" and confidence around 85-95
- Provide practical, actionable advice that a farmer can easily follow
- Consider weather conditions when giving advice
- Use Indian agricultural context and recommend commonly available fertilizers in India
- Always include specific dosages and timing
- Return ONLY valid JSON, no markdown, no explanations`;
};

const createImagePart = (base64Image) => ({
  inlineData: {
    data: base64Image,
    mimeType: 'image/jpeg'
  }
});

const parseAIResponse = (text) => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from AI');
  }
  return JSON.parse(jsonMatch[0]);
};

const validateResult = (parsedResult) => ({
  disease: parsedResult.disease || 'Unknown',
  confidence: Math.min(100, Math.max(0, parseInt(parsedResult.confidence) || 0)),
  severity: ['low', 'moderate', 'high', 'critical'].includes(parsedResult.severity) ? parsedResult.severity : 'low',
  causes: Array.isArray(parsedResult.causes) ? parsedResult.causes : [],
  cure_steps: Array.isArray(parsedResult.cure_steps) ? parsedResult.cure_steps : [],
  fertilizers: Array.isArray(parsedResult.fertilizers) ? parsedResult.fertilizers : [],
  prevention: Array.isArray(parsedResult.prevention) ? parsedResult.prevention : [],
  weather_advice: parsedResult.weather_advice || '',
  action_plan: {
    today: parsedResult.action_plan?.today || '',
    next_3_days: parsedResult.action_plan?.next_3_days || '',
    next_7_days: parsedResult.action_plan?.next_7_days || ''
  },
  ai_confidence_level: parsedResult.confidence >= 80 ? 'high' : parsedResult.confidence >= 60 ? 'medium' : 'low'
});

const analyzeWithModel = async (model, prompt, imagePart) => {
  return await retryWithBackoff(
    async () => {
      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response;
      const text = response.text();
      return parseAIResponse(text);
    },
    {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 8000,
      onRetry: ({ attempt, delay: backoffTime }) => {
        console.warn(`Retry attempt ${attempt} after ${backoffTime}ms due to rate limit`);
      }
    }
  );
};

const analyzeCropImage = async (imageData, cropType, weatherData, location) => {
  try {
    const imageHash = require('crypto')
      .createHash('sha256')
      .update(imageData)
      .digest('hex');

    const cachedResult = getCachedAnalysis(imageHash);
    if (cachedResult) {
      console.log('Returning cached analysis result');
      return {
        ...cachedResult.result,
        fromCache: true,
        cachedAt: cachedResult.timestamp
      };
    }

    const base64Image = imageData.toString('base64');
    const prompt = createAnalysisPrompt(cropType, weatherData, location);
    const imagePart = createImagePart(base64Image);

    let parsedResult;
    try {
      console.log('Attempting analysis with Flash-Lite model...');
      parsedResult = await analyzeWithModel(flashLiteModel, prompt, imagePart);
      console.log(`Flash-Lite result: confidence=${parsedResult.confidence}`);
    } catch (liteError) {
      if (isRateLimitError(liteError)) {
        console.warn('Flash-Lite rate limited, falling back to Flash model...');
        parsedResult = await analyzeWithModel(flashModel, prompt, imagePart);
        console.log(`Flash result: confidence=${parsedResult.confidence}`);
      } else {
        throw liteError;
      }
    }

    const validatedResult = validateResult(parsedResult);

    cacheAnalysis(imageHash, validatedResult, {
      cropType,
      location
    });

    return validatedResult;
  } catch (error) {
    console.error('Gemini AI Error:', error);
    throw new Error('Failed to analyze crop image: ' + error.message);
  }
};

const generateVoiceResponse = async (transcript, weatherData, location) => {
  try {
    const prompt = `A farmer has spoken the following message about their crop:

FARMER'S MESSAGE: "${transcript}"
LOCATION: ${location || 'Unknown'}
WEATHER: ${JSON.stringify(weatherData || {})}

Provide a helpful response in this exact JSON format:
{
  "disease": "Disease name or 'Need Image' if unclear",
  "confidence": 0-100,
  "severity": "low|moderate|high|critical",
  "causes": ["cause 1"],
  "cure_steps": [{"step": 1, "instruction": "advice", "estimated_time": "1-2 days"}],
  "fertilizers": [{"name": "fertilizer", "dosage": "amount", "timing": "when", "buy_link": "", "price": "", "rating": 4}],
  "prevention": ["tip"],
  "weather_advice": "advice based on weather",
  "action_plan": {"today": "today's action", "next_3_days": "actions", "next_7_days": "actions"}
}

Return ONLY valid JSON.`;

    const result = await retryWithBackoff(async () => {
      return await flashModel.generateContent(prompt);
    });

    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Voice Response Error:', error);
    throw new Error('Failed to generate voice response');
  }
};

module.exports = {
  analyzeCropImage,
  generateVoiceResponse
};
