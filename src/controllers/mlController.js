const { spawn } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

const validateInput = (val, min, max) => {
  const num = parseFloat(val);
  if (isNaN(num)) return null;
  if (num < min || num > max) return null;
  return num;
};

const mlPredict = async (req, res, next) => {
  try {
    const { N, P, K, temperature, humidity, ph, rainfall } = req.body;
    const input = {
      N: validateInput(N, 0, 200),
      P: validateInput(P, 0, 200),
      K: validateInput(K, 0, 200),
      temperature: validateInput(temperature, 0, 60),
      humidity: validateInput(humidity, 0, 100),
      ph: validateInput(ph, 0, 14),
      rainfall: validateInput(rainfall, 0, 500)
    };
    const missing = Object.entries(input).filter(([, v]) => v === null).map(([k]) => k);
    if (missing.length) {
      return res.status(400).json({ success: false, error: 'Invalid input', message: `Invalid or out-of-range values for: ${missing.join(', ')}` });
    }
    const mlScriptPath = path.join(__dirname, '../../ml_service/predict.py');
    const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
    const result = await new Promise((resolve, reject) => {
      const python = spawn(pythonPath, [mlScriptPath, JSON.stringify(input)], { timeout: 30000 });
      let stdout = '', stderr = '';
      python.stdout.on('data', (d) => { stdout += d.toString(); });
      python.stderr.on('data', (d) => { stderr += d.toString(); });
      python.on('close', (code) => {
        if (code !== 0) { reject(new Error(stderr)); return; }
        try { resolve(JSON.parse(stdout)); } catch (e) { reject(new Error('Invalid ML response')); }
      });
      python.on('error', (err) => { reject(err); });
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error('ML predict error:', error);
    res.status(500).json({ success: false, error: 'ML prediction failed', message: error.message });
  }
};

module.exports = { mlPredict };
