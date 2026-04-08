const OpenAI = require('openai');
const { retryWithBackoff } = require('../utils/rateLimitHandler');
const { getCachedAnalysis, cacheAnalysis } = require('./cacheService');

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
});

const MODEL = 'meta/llama-3.2-11b-vision-instruct';

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
  ai_confidence_level: parsedResult.confidence >= 80 ? 'high' : parsedResult.confidence >= 60 ? 'medium' : 'low',
  model_used: 'llama-3.2-11b-vision'
});

const analyzeCropImage = async (imageData, cropType, weatherData, location) => {
  try {
    const imageHash = require('crypto')
      .createHash('sha256')
      .update(imageData)
      .digest('hex');

    const cachedResult = getCachedAnalysis(imageHash);
    if (cachedResult) {
      console.log('Returning cached analysis result (NVIDIA)');
      return {
        ...cachedResult.result,
        fromCache: true,
        cachedAt: cachedResult.timestamp
      };
    }

    const base64Image = imageData.toString('base64');
    const prompt = createAnalysisPrompt(cropType, weatherData, location);

    console.log('Attempting analysis with Llama-3.2-11b-Vision (NVIDIA)...');

    const result = await retryWithBackoff(
      async () => {
        const response = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 2048,
          temperature: 0.7
        });

        const text = response.choices[0].message.content;
        return parseAIResponse(text);
      },
      {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 16000,
        onRetry: ({ attempt, delay: backoffTime }) => {
          console.warn(`NVIDIA retry attempt ${attempt} after ${backoffTime}ms`);
        }
      }
    );

    const validatedResult = validateResult(result);

    cacheAnalysis(imageHash, validatedResult, {
      cropType,
      location
    });

    return validatedResult;
  } catch (error) {
    console.error('NVIDIA AI Error:', error);
    throw new Error('Failed to analyze crop image with NVIDIA: ' + error.message);
  }
};

module.exports = {
  analyzeCropImage
};