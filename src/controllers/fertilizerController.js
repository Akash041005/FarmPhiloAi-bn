const Fertilizer = require('../models/Fertilizer');
const fallbackFertilizers = require('../seed/fertilizers');
const Recommendation = require('../models/Recommendation');
const logger = require('../utils/logger');

// Crop NPK baselines (kg/acre standard recommendation)
const CROP_NPK_STANDARDS = {
  Rice: { N: 48, P: 24, K: 24, name: 'Rice / Paddy', duration: '120-140 days' },
  Wheat: { N: 50, P: 25, K: 20, name: 'Wheat', duration: '110-130 days' },
  Cotton: { N: 60, P: 30, K: 30, name: 'Cotton', duration: '150-180 days' },
  Sugarcane: { N: 100, P: 40, K: 48, name: 'Sugarcane', duration: '300-365 days' },
  Maize: { N: 48, P: 24, K: 20, name: 'Maize (Corn)', duration: '90-110 days' },
  Tomato: { N: 60, P: 40, K: 40, name: 'Tomato', duration: '90-120 days' },
  Potato: { N: 72, P: 40, K: 48, name: 'Potato', duration: '90-110 days' },
  Chilli: { N: 48, P: 24, K: 24, name: 'Chilli', duration: '120-150 days' },
  Soybean: { N: 12, P: 32, K: 16, name: 'Soybean', duration: '90-105 days' },
  Groundnut: { N: 10, P: 20, K: 20, name: 'Groundnut (Peanut)', duration: '105-120 days' },
  Banana: { N: 80, P: 30, K: 120, name: 'Banana', duration: '300-365 days' },
  Onion: { N: 40, P: 20, K: 32, name: 'Onion', duration: '90-120 days' },
  Default: { N: 40, P: 20, K: 20, name: 'General Crop', duration: '90-120 days' }
};

const getFertilizers = async (req, res, next) => {
  try {
    const { q, crop, type } = req.query;
    let query = {};
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (q) query.name = { $regex: esc(q), $options: 'i' };
    if (crop) query.suitableCrops = { $in: [new RegExp(esc(crop), 'i')] };
    if (type && type !== 'all') query.type = type;

    let fertilizers = [];
    try {
      fertilizers = await Fertilizer.find(query).limit(50).select('-__v');
    } catch (dbErr) {
      logger.warn('Database query failed, using in-memory fertilizer catalog');
    }

    // Fallback to in-memory seed dataset if DB returned empty or had an issue
    if (!fertilizers || fertilizers.length === 0) {
      fertilizers = fallbackFertilizers.filter(f => {
        const matchesQ = !q || f.name.toLowerCase().includes(q.toLowerCase()) || f.description.toLowerCase().includes(q.toLowerCase());
        const matchesType = !type || type === 'all' || f.type === type;
        const matchesCrop = !crop || f.suitableCrops?.some(c => c.toLowerCase().includes(crop.toLowerCase()));
        return matchesQ && matchesType && matchesCrop;
      });
    }

    res.status(200).json({
      success: true,
      count: fertilizers.length,
      fertilizers
    });
  } catch (error) {
    logger.error('Get fertilizers error:', error);
    next(error);
  }
};

const calculateFertilizer = async (req, res, next) => {
  try {
    const { cropType = 'Rice', area = 1, areaUnit = 'acre', soilN = 50, soilP = 25, soilK = 25 } = req.body;
    const acres = areaUnit === 'hectare' ? area * 2.47105 : parseFloat(area) || 1;

    // Get standard requirement
    const standard = CROP_NPK_STANDARDS[cropType] || CROP_NPK_STANDARDS.Default;

    // Adjust based on soil test (if provided)
    // Baseline: Medium soil test index = 100% standard; High = 80%; Low = 120%
    const nFactor = soilN > 70 ? 0.8 : soilN < 30 ? 1.25 : 1.0;
    const pFactor = soilP > 40 ? 0.8 : soilP < 15 ? 1.25 : 1.0;
    const kFactor = soilK > 40 ? 0.8 : soilK < 15 ? 1.25 : 1.0;

    const totalN = Math.round(standard.N * nFactor * acres);
    const totalP = Math.round(standard.P * pFactor * acres);
    const totalK = Math.round(standard.K * kFactor * acres);

    // Calculate fertilizer commercial products:
    // 1. DAP (18% N, 46% P2O5) supplies all P:
    // DAP kg = totalP / 0.46
    const dapKg = Math.round(totalP / 0.46);
    const dapBags = Math.ceil(dapKg / 50); // 50kg bags
    const nFromDap = Math.round(dapKg * 0.18);

    // 2. Remaining N supplied via Urea (46% N):
    const remainingN = Math.max(0, totalN - nFromDap);
    const ureaKg = Math.round(remainingN / 0.46);
    const ureaBags = Math.ceil(ureaKg / 45); // 45kg bags in India

    // 3. MOP (Muriate of Potash, 60% K2O) supplies K:
    const mopKg = Math.round(totalK / 0.60);
    const mopBags = Math.ceil(mopKg / 50); // 50kg bags

    // Organic recommendation
    const vermicompostBags = Math.round(acres * 10); // 50kg bags per acre
    const neemCakeKg = Math.round(acres * 100);

    // Application schedule breakdown
    const schedule = [
      {
        stage: 'Basal Dose (At Sowing / Transplanting)',
        timing: 'Day 0',
        instructions: `Apply 100% DAP (${dapKg} kg), 50% MOP (${Math.round(mopKg * 0.5)} kg), and 25% Urea (${Math.round(ureaKg * 0.25)} kg) mixed in soil.`,
        fertilizers: [
          { name: 'DAP (18-46-0)', quantity: `${dapKg} kg (${dapBags} bags)` },
          { name: 'MOP (Potash 60%)', quantity: `${Math.round(mopKg * 0.5)} kg` },
          { name: 'Urea (46% N)', quantity: `${Math.round(ureaKg * 0.25)} kg` }
        ]
      },
      {
        stage: 'Vegetative Growth (Tillering / Branching)',
        timing: 'Day 20 - 30',
        instructions: `Top-dress 50% Urea (${Math.round(ureaKg * 0.5)} kg) after first weeding with sufficient soil moisture.`,
        fertilizers: [
          { name: 'Urea (46% N)', quantity: `${Math.round(ureaKg * 0.5)} kg` },
          { name: 'Zinc Sulfate (21%)', quantity: `${Math.round(acres * 10)} kg (recommended foliar/soil)` }
        ]
      },
      {
        stage: 'Flowering & Panicle / Fruit Initiation',
        timing: 'Day 45 - 60',
        instructions: `Top-dress remaining 25% Urea (${Math.round(ureaKg * 0.25)} kg) and 50% MOP (${Math.round(mopKg * 0.5)} kg).`,
        fertilizers: [
          { name: 'Urea (46% N)', quantity: `${Math.round(ureaKg * 0.25)} kg` },
          { name: 'MOP (Potash 60%)', quantity: `${Math.round(mopKg * 0.5)} kg` }
        ]
      }
    ];

    // Estimated approximate cost in INR
    const estimatedCost = {
      urea: ureaBags * 266, // Gov subsidized price ~ ₹266 per 45kg bag
      dap: dapBags * 1350,  // Gov subsidized price ~ ₹1350 per 50kg bag
      mop: mopBags * 1700,  // ~ ₹1700 per 50kg bag
      totalMin: (ureaBags * 266) + (dapBags * 1350) + (mopBags * 1700),
      totalMax: Math.round(((ureaBags * 266) + (dapBags * 1350) + (mopBags * 1700)) * 1.15)
    };

    res.status(200).json({
      success: true,
      calculation: {
        crop: cropType,
        area: `${area} ${areaUnit}`,
        acresCalculated: acres,
        nutrientsRequired: {
          nitrogen: `${totalN} kg N`,
          phosphorus: `${totalP} kg P₂O₅`,
          potassium: `${totalK} kg K₂O`
        },
        commercialProducts: [
          { name: 'Urea (46-0-0)', quantityKg: ureaKg, bags: ureaBags, bagSize: '45 kg', estPrice: `₹${ureaBags * 266}` },
          { name: 'DAP (18-46-0)', quantityKg: dapKg, bags: dapBags, bagSize: '50 kg', estPrice: `₹${dapBags * 1350}` },
          { name: 'MOP (0-0-60)', quantityKg: mopKg, bags: mopBags, bagSize: '50 kg', estPrice: `₹${mopBags * 1700}` }
        ],
        organicSupplements: [
          { name: 'Vermicompost', quantity: `${vermicompostBags} bags (50kg each)`, benefit: 'Improves soil organic carbon & microbial health' },
          { name: 'Neem Cake', quantity: `${neemCakeKg} kg`, benefit: 'Nematode control and nitrogen nitrification inhibition' }
        ],
        applicationSchedule: schedule,
        estimatedTotalCost: `₹${estimatedCost.totalMin.toLocaleString()} - ₹${estimatedCost.totalMax.toLocaleString()}`
      }
    });
  } catch (error) {
    logger.error('Calculate fertilizer error:', error);
    next(error);
  }
};

const recommendFertilizer = async (req, res, next) => {
  try {
    const { cropType, disease, soilN, soilP, soilK } = req.body;
    if (!cropType) {
      return res.status(400).json({ success: false, error: 'Crop type required', message: 'Please provide the crop type' });
    }

    // Default agronomic advice based on crop
    const standard = CROP_NPK_STANDARDS[cropType] || CROP_NPK_STANDARDS.Default;
    const recommendations = [
      {
        name: 'DAP (Di-Ammonium Phosphate 18-46-0)',
        type: 'chemical',
        nutrients: { N: 18, P: 46, K: 0 },
        dosage: '50 kg/acre',
        timing: 'Apply 100% as basal dose during final land preparation',
        method: 'soil',
        price: '₹1,350 / 50kg bag',
        rating: 4.8,
        reason: 'Essential high phosphorus for rapid root branching and seedling establishment'
      },
      {
        name: 'Neem Coated Urea (46% N)',
        type: 'chemical',
        nutrients: { N: 46, P: 0, K: 0 },
        dosage: '45-90 kg/acre in 2-3 split doses',
        timing: '1st split at 25-30 days, 2nd split at flowering stage',
        method: 'soil',
        price: '₹266 / 45kg bag',
        rating: 4.9,
        reason: 'Provides gradual nitrogen release for lush vegetative green foliage'
      },
      {
        name: 'MOP (Muriate of Potash 60% K)',
        type: 'chemical',
        nutrients: { N: 0, P: 0, K: 60 },
        dosage: '25-35 kg/acre',
        timing: 'Split: 50% at sowing, 50% at flowering/grain formation',
        method: 'soil',
        price: '₹1,700 / 50kg bag',
        rating: 4.7,
        reason: 'Enhances disease resistance, drought tolerance, and grain/fruit weight'
      },
      {
        name: 'Enriched Vermicompost',
        type: 'organic',
        nutrients: { N: 2, P: 1.5, K: 1.5 },
        dosage: '500-1000 kg/acre',
        timing: 'Mix thoroughly into soil 10-15 days before sowing',
        method: 'soil',
        price: '₹350 / 50kg bag',
        rating: 4.9,
        reason: 'Supplies micronutrients and beneficial soil microflora to improve soil texture'
      }
    ];

    const generalAdvice = `For optimal ${cropType} yield, adopt Integrated Nutrient Management (INM) combining organic vermicompost with balanced split application of NPK. Avoid single heavy urea doses to reduce fungal vulnerability.`;

    res.status(200).json({
      success: true,
      recommendations,
      generalAdvice
    });
  } catch (error) {
    logger.error('Fertilizer recommendation error:', error);
    next(error);
  }
};

const getFertilizerById = async (req, res, next) => {
  try {
    let fertilizer = null;
    try {
      fertilizer = await Fertilizer.findById(req.params.id);
    } catch (e) {}

    if (!fertilizer) {
      fertilizer = fallbackFertilizers.find(f => f.name.toLowerCase().includes(req.params.id.toLowerCase()));
    }

    if (!fertilizer) {
      return res.status(404).json({ success: false, error: 'Fertilizer not found' });
    }

    res.status(200).json({ success: true, fertilizer });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFertilizers,
  calculateFertilizer,
  recommendFertilizer,
  getFertilizerById
};
