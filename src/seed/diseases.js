const mongoose = require('mongoose');

const diseases = [
  // Rice diseases
  {
    name: 'Rice Blast',
    commonNames: ['Blast Disease', 'Paddy Blast', 'Neergi Roga'],
    cropType: 'Rice',
    description: 'Fungal disease caused by Magnaporthe oryzae affecting leaves, nodes, and panicles.',
    symptoms: ['Diamond-shaped lesions with gray centers on leaves', 'White/gray center with brown border on lesions', 'Lesions on leaf collar and nodes', 'Panicle blast causing white/empty grains', 'Complete drying of affected tillers'],
    causes: ['High humidity (>90%)', 'Temperatures between 25-30°C', 'Excessive nitrogen fertilization', 'Continuous rice cropping', 'Dense planting'],
    severity: 'high',
    treatment: [
      { step: 1, instruction: 'Apply Tricyclazole 75% WP at 0.6g/L or Carbendazim 50% WP at 1g/L', estimated_time: 'Immediately upon detection', method: 'chemical' },
      { step: 2, instruction: 'Spray Neem oil 5ml/L or Trichoderma viride formulation', estimated_time: '7 days after chemical spray', method: 'organic' },
      { step: 3, instruction: 'Remove and destroy infected plant debris', estimated_time: 'Ongoing', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Potassium Chloride (MOP)', type: 'chemical', dosage: '40-50 kg/ha', timing: 'At disease onset', price: '₹20/kg' },
      { name: 'Silicon-based Fertilizer', type: 'chemical', dosage: '100 kg/ha', timing: 'Before planting', price: '₹30/kg' }
    ],
    prevention: ['Use resistant varieties like MTU-1010, BPT-5204', 'Avoid excessive nitrogen', 'Maintain proper plant spacing', 'Practice crop rotation', 'Use balanced fertilization'],
    seasonal: 'kharif',
    regions: ['Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Punjab', 'West Bengal', 'Odisha'],
    imageUrls: ['https://example.com/rice-blast.jpg']
  },
  {
    name: 'Rice Bacterial Leaf Blight',
    commonNames: ['BLB', 'Bacterial Blight'],
    cropType: 'Rice',
    description: 'Bacterial disease caused by Xanthomonas oryzae pv. oryzae causing severe yield loss.',
    symptoms: ['Water-soaked stripes on leaf margins', 'Yellowish lesions with wavy margins', 'Wilting of leaves', 'Milky bacterial ooze from lesions', 'Complete leaf drying'],
    causes: ['High humidity and rainfall', 'Wind-borne bacteria', 'Infected seeds and stubble', 'Flood irrigation', 'Injuries to plants'],
    severity: 'critical',
    treatment: [
      { step: 1, instruction: 'Apply Streptomycin sulfate 0.1g/L + Copper oxychloride 2g/L', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Remove infected plants from field', estimated_time: 'Within 24 hours', method: 'preventive' },
      { step: 3, instruction: 'Drain out water and keep fields dry', estimated_time: '5-7 days', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Potassium Sulphate (SOP)', type: 'chemical', dosage: '30 kg/ha', timing: 'At early symptoms', price: '₹25/kg' }
    ],
    prevention: ['Use resistant varieties', 'Treat seeds with hot water (50°C for 30 min)', 'Avoid flooding fields', 'Practice crop rotation with legumes', 'Use balanced NPK with higher potassium'],
    seasonal: 'kharif',
    regions: ['Andhra Pradesh', 'Telangana', 'Odisha', 'West Bengal', 'Chhattisgarh'],
    imageUrls: ['https://example.com/blb.jpg']
  },
  {
    name: 'Rice Brown Spot',
    commonNames: ['Brown Leaf Spot', 'Helminthosporium Leaf Spot'],
    cropType: 'Rice',
    description: 'Fungal disease caused by Cochliobolus miyabeanus, significant in nutrient-deficient soils.',
    symptoms: ['Small circular brown spots on leaves', 'Dark brown margins with gray center', 'Spots coalesce forming large patches', 'Discolored grains', 'Reduced grain weight'],
    causes: ['Nitrogen deficiency', 'Zinc deficiency', 'Poor soil drainage', 'Continuous moisture on leaves', 'Use of susceptible varieties'],
    severity: 'moderate',
    treatment: [
      { step: 1, instruction: 'Spray Mancozeb 75WP at 2.5g/L or Carbendazim 1g/L', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Apply Zinc Sulphate 25kg/ha + Lime 10kg/ha', estimated_time: 'Before next irrigation', method: 'chemical' },
      { step: 3, instruction: 'Foliar spray of Pseudomonad formulation', estimated_time: '15 days interval', method: 'organic' }
    ],
    fertilizers: [
      { name: 'Zinc Sulphate', type: 'chemical', dosage: '25 kg/ha', timing: 'At disease appearance', price: '₹60/kg' },
      { name: 'Compost Tea', type: 'organic', dosage: '500 L/ha', timing: 'Weekly', price: '₹5/L' }
    ],
    prevention: ['Apply balanced fertilization', 'Use zinc-enriched fertilizers', 'Plant resistant varieties', 'Proper drainage', 'Seed treatment before sowing'],
    seasonal: 'kharif',
    regions: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Andhra Pradesh', 'Bihar'],
    imageUrls: ['https://example.com/brown-spot.jpg']
  },
  // Wheat diseases
  {
    name: 'Wheat Rust (Yellow)',
    commonNames: ['Stripe Rust', 'Yellow Rust', 'Pili Katu'],
    cropType: 'Wheat',
    description: 'Fungal disease caused by Puccinia striiformis, devastating in cool climates.',
    symptoms: ['Yellow/orange stripe-like pustules on leaves', 'Powdery yellow spores on stripes', 'Chlorosis (yellowing) of leaf tissue', 'Premature leaf death', 'Shriveled grains'],
    causes: ['Cool temperatures (10-20°C)', 'High humidity', 'Continuous wheat cultivation', 'Susceptible varieties', 'Delayed sowing'],
    severity: 'critical',
    treatment: [
      { step: 1, instruction: 'Apply Propiconazole 25EC at 1ml/L or Tebuconazole 1ml/L', estimated_time: 'Immediately at first appearance', method: 'chemical' },
      { step: 2, instruction: 'Foliar spray of sulfur 2g/L', estimated_time: '10-14 days after fungicide', method: 'chemical' },
      { step: 3, instruction: 'Spray neem-based organic fungicide', estimated_time: 'Every 15 days', method: 'organic' }
    ],
    fertilizers: [
      { name: 'Potassium Sulphate', type: 'chemical', dosage: '40 kg/ha', timing: 'At disease onset', price: '₹25/kg' }
    ],
    prevention: ['Grow resistant varieties like HD-2967, PBW-343', 'Avoid excess nitrogen', 'Early or timely sowing', 'Crop rotation with non-cereals', 'Monitor fields regularly from February onwards'],
    seasonal: 'rabi',
    regions: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Rajasthan', 'Madhya Pradesh', 'Bihar'],
    imageUrls: ['https://example.com/yellow-rust.jpg']
  },
  {
    name: 'Wheat Brown Rust',
    commonNames: ['Leaf Rust', 'Brown Rust'],
    cropType: 'Wheat',
    description: 'Fungal disease caused by Puccinia triticina, most common wheat rust worldwide.',
    symptoms: ['Small reddish-brown circular pustules on leaves', 'Pustules randomly scattered on leaf surface', 'Brown spores rub off easily', 'Leaf senescence accelerated', 'Yield loss up to 30%'],
    causes: ['Temperatures 15-25°C', 'High humidity', 'Overlapping wheat crops', 'Volunteer wheat plants', 'Susceptible varieties'],
    severity: 'high',
    treatment: [
      { step: 1, instruction: 'Apply Azoxystrobin 23SC at 1ml/L or Mancozeb 2.5g/L', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Spray potassium silicate 5ml/L', estimated_time: 'Weekly', method: 'organic' },
      { step: 3, instruction: 'Remove volunteer wheat and alternate hosts', estimated_time: 'Ongoing', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Mono Potassium Phosphate (MKP)', type: 'chemical', dosage: '5g/L spray', timing: 'At early symptoms', price: '₹50/kg' }
    ],
    prevention: ['Plant resistant varieties', 'Destroy volunteer wheat', 'Balanced NPK application', 'Avoid excess irrigation', 'Early sowing'],
    seasonal: 'rabi',
    regions: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Gujarat'],
    imageUrls: ['https://example.com/brown-rust.jpg']
  },
  {
    name: 'Wheat Karnal Bunt',
    commonNames: ['Partial Bunt', 'Karnal Smut'],
    cropType: 'Wheat',
    description: 'Fungal disease caused by Tilletia indica, a quarantine pest in many countries.',
    symptoms: ['Fishy odor in harvested grain', 'Blackened grain portions', 'Broken grains with black powder', 'Partial infection of grains', 'Discolored flour'],
    causes: ['High humidity during flowering', 'Temperatures 18-22°C', 'Rainfall during heading', 'Infected seeds', 'Continuous wheat cropping'],
    severity: 'high',
    treatment: [
      { step: 1, instruction: 'Apply Propiconazole 25EC at 1ml/L at flowering stage', estimated_time: 'At 50% flowering', method: 'chemical' },
      { step: 2, instruction: 'Seed treatment with Carboxin 37.5% + Thiram 37.5% at 2.5g/kg', estimated_time: 'Before sowing', method: 'chemical' },
      { step: 3, instruction: 'Hot water seed treatment at 52°C for 10 minutes', estimated_time: 'Before sowing', method: 'organic' }
    ],
    fertilizers: [
      { name: 'Gypsum (Calcium Sulphate)', type: 'chemical', dosage: '200 kg/ha', timing: 'Before sowing', price: '₹5/kg' }
    ],
    prevention: ['Use certified disease-free seeds', 'Practice long crop rotation (3+ years)', 'Early sowing reduces risk', 'Spray fungicides at flowering', 'Follow quarantine regulations'],
    seasonal: 'rabi',
    regions: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Himachal Pradesh', 'Jammu & Kashmir'],
    imageUrls: ['https://example.com/karnal-bunt.jpg']
  },
  // Cotton diseases
  {
    name: 'Cotton Leaf Curl Disease',
    commonNames: ['CLCuD', 'Leaf Curl Virus'],
    cropType: 'Cotton',
    description: 'Viral disease transmitted by whitefly (Bemisia tabaci), devastating to cotton yields.',
    symptoms: ['Leaf curling (upward/downward)', 'Thickened and darkened veins', 'Enation (leaf-like) growth on veins', 'Stunted plant growth', 'Reduced boll formation'],
    causes: ['Whitefly infestation', 'Viral vector transmission', 'Drought stress', 'Close spacing of plants', 'Infected crop residue'],
    severity: 'critical',
    treatment: [
      { step: 1, instruction: 'Apply Imidacloprid 17.8SL at 0.5ml/L or Acetamiprid 0.5g/L for whitefly', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Install yellow sticky traps at 12-15 per acre', estimated_time: 'Ongoing', method: 'preventive' },
      { step: 3, instruction: 'Spray neem oil 5ml/L + liquid soap', estimated_time: 'Weekly', method: 'organic' },
      { step: 4, instruction: 'Remove and destroy infected plants', estimated_time: 'As detected', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Magnesium Sulphate', type: 'chemical', dosage: '20 kg/ha', timing: 'At early stage', price: '₹40/kg' }
    ],
    prevention: ['Grow CLCuD-resistant Bt cotton hybrids', 'Control whitefly population early', 'Remove weed hosts (Putumba, Bhang)', 'Border crop with sunflower', 'Avoid overlapping cotton seasons'],
    seasonal: 'kharif',
    regions: ['Punjab', 'Haryana', 'Rajasthan', 'Gujarat', 'Maharashtra'],
    imageUrls: ['https://example.com/leaf-curl.jpg']
  },
  {
    name: 'Cotton Bacterial Blight',
    commonNames: ['Angular Leaf Spot', 'Black Arm'],
    cropType: 'Cotton',
    description: 'Bacterial disease caused by Xanthomonas citri subsp. malvacearum.',
    symptoms: ['Angular water-soaked spots on leaves', 'Dark brown to black lesions on stems', 'Boll rot with water-soaked spots', 'Vein necrosis in leaves', 'Defoliation in severe cases'],
    causes: ['Warm and humid weather', 'Rain and wind splash', 'Infected seeds', 'Crop residue', 'Mechanical injury'],
    severity: 'high',
    treatment: [
      { step: 1, instruction: 'Spray Streptomycin 0.1g/L + Copper oxychloride 2.5g/L', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Dusting of Bleaching powder 20kg/ha', estimated_time: 'When dew is present', method: 'chemical' },
      { step: 3, instruction: 'Destroy infected debris after harvest', estimated_time: 'After harvest', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Muriate of Potash (MOP)', type: 'chemical', dosage: '50 kg/ha', timing: 'At squaring stage', price: '₹20/kg' }
    ],
    prevention: ['Use acid-delinted seeds', 'Seed treatment with Streptomycin', 'Crop rotation with non-host crops', 'Remove weed hosts', 'Follow 3-year rotation'],
    seasonal: 'kharif',
    regions: ['Gujarat', 'Maharashtra', 'Telangana', 'Andhra Pradesh', 'Karnataka'],
    imageUrls: ['https://example.com/cotton-blight.jpg']
  },
  // Groundnut diseases
  {
    name: 'Groundnut Tikka Disease',
    commonNames: ['Early Leaf Spot', 'Tikka Leaf Spot'],
    cropType: 'Groundnut',
    description: 'Fungal disease caused by Cercospora arachidicola, most common groundnut disease.',
    symptoms: ['Small circular brown spots on leaves', 'Yellow halo around spots', 'Premature defoliation', 'Reduced pod filling', 'Dark spots on stems'],
    causes: ['Warm humid weather (25-30°C)', 'High rainfall', 'Dense planting', 'Poor soil fertility', 'Continuous groundnut cultivation'],
    severity: 'high',
    treatment: [
      { step: 1, instruction: 'Spray Mancozeb 75WP at 2.5g/L or Chlorothalonil 2g/L', estimated_time: 'At first appearance', method: 'chemical' },
      { step: 2, instruction: 'Spray Bordeaux mixture 1%', estimated_time: 'Every 15 days', method: 'organic' },
      { step: 3, instruction: 'Remove lower infected leaves', estimated_time: 'Weekly', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Gypsum', type: 'chemical', dosage: '500 kg/ha', timing: 'At pegging stage', price: '₹5/kg' }
    ],
    prevention: ['Grow tolerant varieties', 'Follow 3-year crop rotation', 'Avoid dense planting', 'Remove volunteer plants', 'Balanced potassium application'],
    seasonal: 'kharif',
    regions: ['Gujarat', 'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra'],
    imageUrls: ['https://example.com/tikka.jpg']
  },
  // Sugarcane diseases
  {
    name: 'Sugarcane Red Rot',
    commonNames: ['Red Rot Disease', 'Lal Gala Sada', 'Red Smut'],
    cropType: 'Sugarcane',
    description: 'Serious fungal disease caused by Colletotrichum falcatum, affects stalk storage.',
    symptoms: ['Red discoloration of internal stalk tissue', 'Narrow white patches across red areas', 'Drying and withering of leaves', 'Stalk becomes hollow and light', 'Cane breaks at nodes'],
    causes: ['Rainy season with high humidity', 'Setts (seed pieces) infected', 'Soil-borne fungus', 'Monocropping of sugarcane', 'Injuries to canes'],
    severity: 'critical',
    treatment: [
      { step: 1, instruction: 'Remove and destroy infected clumps immediately', estimated_time: 'Immediately', method: 'preventive' },
      { step: 2, instruction: 'Treat setts with Carbendazim 1g/L + Tebuconazole 1ml/L for 15 min', estimated_time: 'Before planting', method: 'chemical' },
      { step: 3, instruction: 'Apply Trichoderma viride 5kg/ha in soil', estimated_time: 'At planting', method: 'organic' },
      { step: 4, instruction: 'Follow crop rotation with paddy/legumes', estimated_time: 'Seasonal', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Potassium Sulphate', type: 'chemical', dosage: '80 kg/ha', timing: 'After disease control', price: '₹25/kg' }
    ],
    prevention: ['Use disease-free certified setts', 'Plant resistant varieties like Co 0238, Co 86032', 'Avoid ratooning infected fields', 'Crop rotation with paddy', 'Remove infected clumps with roots'],
    seasonal: 'kharif',
    regions: ['Uttar Pradesh', 'Maharashtra', 'Tamil Nadu', 'Karnataka', 'Punjab', 'Bihar'],
    imageUrls: ['https://example.com/red-rot.jpg']
  },
  // Tomato diseases
  {
    name: 'Tomato Late Blight',
    commonNames: ['Potato/Tomato Blight'],
    cropType: 'Tomato',
    description: 'Devastating fungal disease caused by Phytophthora infestans, affects both tomato and potato.',
    symptoms: ['Water-soaked dark green spots on leaves', 'White fungal growth on lower leaf surface', 'Dark brown lesions on stems', 'Brown greasy spots on fruits', 'Rapid wilting and death of plants'],
    causes: ['Cool wet weather (10-20°C)', 'High humidity (>90%)', 'Rain and fog', 'Dense canopy', 'Irrigation splash'],
    severity: 'critical',
    treatment: [
      { step: 1, instruction: 'Apply Metalaxyl MZ 68WG at 2g/L or Mancozeb 2.5g/L', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Spray Bordeaux mixture 1%', estimated_time: 'Every 10 days', method: 'organic' },
      { step: 3, instruction: 'Improve air circulation by pruning lower branches', estimated_time: 'Ongoing', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Potassium Nitrate', type: 'chemical', dosage: '10g/L (foliar)', timing: 'Weekly', price: '₹40/kg' }
    ],
    prevention: ['Use resistant hybrid varieties', 'Keep leaves dry (drip irrigation)', 'Avoid overhead irrigation', 'Space plants 60cm apart', 'Remove volunteer potato/tomato plants'],
    seasonal: 'rabi',
    regions: ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Himachal Pradesh'],
    imageUrls: ['https://example.com/late-blight.jpg']
  },
  {
    name: 'Tomato Leaf Curl Virus',
    commonNames: ['ToLCV', 'Tomato Leaf Curl'],
    cropType: 'Tomato',
    description: 'Viral disease transmitted by whitefly, major constraint in tomato production.',
    symptoms: ['Severe leaf curling and puckering', 'Yellowing and chlorosis', 'Stunted plant growth', 'Reduced fruit set', 'Small deformed fruits'],
    causes: ['Whitefly (Bemisia tabaci) infestation', 'High temperature (30-40°C)', 'Dry conditions', 'Infected nursery plants', 'Nearby infected crops'],
    severity: 'high',
    treatment: [
      { step: 1, instruction: 'Apply Imidacloprid 0.5ml/L or Dimethoate 1ml/L for whitefly', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Install yellow sticky traps at 12/acre', estimated_time: 'Ongoing', method: 'preventive' },
      { step: 3, instruction: 'Spray neem oil 3ml/L + liquid detergent', estimated_time: 'Every 10 days', method: 'organic' },
      { step: 4, instruction: 'Remove severely infected plants', estimated_time: 'As detected', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Multi-K (Potassium Nitrate)', type: 'chemical', dosage: '5g/L foliar', timing: 'Weekly', price: '₹40/kg' }
    ],
    prevention: ['Use ToLCV-resistant hybrids', 'Nursery protection with nylon net', 'Whitefly management from nursery stage', 'Reflective mulching', 'Barrier crop with maize'],
    seasonal: 'rabi',
    regions: ['Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Gujarat'],
    imageUrls: ['https://example.com/tolcv.jpg']
  },
  // Potato diseases
  {
    name: 'Potato Late Blight',
    commonNames: ['Blight', 'Potato Blight'],
    cropType: 'Potato',
    description: 'Fungal disease caused by Phytophthora infestans, caused Irish Potato Famine.',
    symptoms: ['Water-soaked pale green spots on leaves', 'White mold on leaf underside', 'Brown purple lesions on stems', 'Brown rot of tubers', 'Foul smell from rotten tubers'],
    causes: ['Cool moist weather (10-20°C)', 'High humidity', 'Rain and heavy dew', 'Infected seed potatoes', 'Poor drainage'],
    severity: 'critical',
    treatment: [
      { step: 1, instruction: 'Apply Metalaxyl MZ 68WG at 2g/L or Dimethomorph 0.5g/L', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Spray Copper oxychloride 2.5g/L', estimated_time: 'Every 10-14 days', method: 'chemical' },
      { step: 3, instruction: 'Spray fermented buttermilk 10% solution', estimated_time: 'Weekly', method: 'organic' }
    ],
    fertilizers: [
      { name: 'Potassium Sulphate', type: 'chemical', dosage: '60 kg/ha', timing: 'During earthing up', price: '₹25/kg' }
    ],
    prevention: ['Use certified disease-free seed potatoes', 'Plant resistant varieties like Kufri Jyoti', 'Hilling up to cover tubers', 'Avoid overhead irrigation', 'Crop rotation (3+ years)'],
    seasonal: 'rabi',
    regions: ['Uttar Pradesh', 'Punjab', 'West Bengal', 'Bihar', 'Gujarat', 'Madhya Pradesh'],
    imageUrls: ['https://example.com/potato-blight.jpg']
  },
  // Maize diseases
  {
    name: 'Maize Downy Mildew',
    commonNames: ['Sorghum Downy Mildew', 'Green Ear Disease'],
    cropType: 'Maize',
    description: 'Fungal disease caused by Peronosclerospora sorghi, causes significant yield reduction.',
    symptoms: ['Chlorotic streaks on leaves', 'White downy growth on lower leaf surface', 'Stunted growth and leaf shredding', 'Abnormal ear formation', 'Green leafy structures replacing tassel'],
    causes: ['High humidity (90-100%)', 'Temperatures 20-25°C', 'Rainfall during early growth', 'Continuous maize cropping', 'Infected soil/debris'],
    severity: 'high',
    treatment: [
      { step: 1, instruction: 'Spray Mancozeb 2.5g/L + Metalaxyl 1g/L', estimated_time: 'At first appearance', method: 'chemical' },
      { step: 2, instruction: 'Seed treatment with Apron 35SD at 6g/kg seed', estimated_time: 'Before sowing', method: 'chemical' },
      { step: 3, instruction: 'Remove and destroy infected plants', estimated_time: 'As detected', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Zinc Sulphate', type: 'chemical', dosage: '25 kg/ha', timing: 'At sowing', price: '₹60/kg' }
    ],
    prevention: ['Grow resistant hybrids', 'Early sowing to avoid humid conditions', 'Seed treatment before planting', 'Follow crop rotation', 'Remove systemic infected plants'],
    seasonal: 'kharif',
    regions: ['Karnataka', 'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh'],
    imageUrls: ['https://example.com/downy-mildew.jpg']
  },
  // Chickpea diseases
  {
    name: 'Chickpea Wilt',
    commonNames: ['Gram Wilt', 'Fusarium Wilt'],
    cropType: 'Chickpea',
    description: 'Fungal disease caused by Fusarium oxysporum f.sp. ciceris, major constraint in chickpea.',
    symptoms: ['Sudden drooping of leaves and petioles', 'Yellowing and drying of foliage', 'Browning of vascular tissue', 'Complete wilting of plant', 'Death within 2-3 weeks'],
    causes: ['Warm soil temperature (25-30°C)', 'Soil-borne fungus', 'Continuous chickpea cultivation', 'Dry conditions', 'Poor drainage'],
    severity: 'high',
    treatment: [
      { step: 1, instruction: 'Drench soil with Carbendazim 1g/L around plant base', estimated_time: 'At first symptoms', method: 'chemical' },
      { step: 2, instruction: 'Apply Trichoderma harzianum 5kg/ha in FYM', estimated_time: 'At sowing', method: 'organic' },
      { step: 3, instruction: 'Remove and burn wilted plants', estimated_time: 'As detected', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Vermicompost', type: 'organic', dosage: '2.5 tons/ha', timing: 'Before sowing', price: '₹8/kg' }
    ],
    prevention: ['Grow resistant varieties like JG-11, KAK-2', 'Follow 4-5 year crop rotation', 'Use Trichoderma-treated seeds', 'Add neem cake 100kg/ha in soil', 'Avoid moisture stress'],
    seasonal: 'rabi',
    regions: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh', 'Karnataka', 'Gujarat'],
    imageUrls: ['https://example.com/chickpea-wilt.jpg']
  },
  // Mustard diseases
  {
    name: 'Mustard White Rust',
    commonNames: ['White Blister', 'Staghead'],
    cropType: 'Mustard',
    description: 'Fungal disease caused by Albugo candida, affects all cruciferous crops.',
    symptoms: ['White/pinkish raised blister-like pustules on leaves', 'Leaf distortion and swelling', 'Inflorescence malformation (staghead)', 'Premature leaf drop', 'Reduced seed yield'],
    causes: ['Cool humid weather', 'Temperatures 10-20°C', 'Dense planting', 'High nitrogen fertility', 'Foggy mornings'],
    severity: 'moderate',
    treatment: [
      { step: 1, instruction: 'Spray Metalaxyl MZ 68WG at 2g/L or Mancozeb 2.5g/L', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Spray Bordeaux mixture 1%', estimated_time: 'Every 15 days', method: 'organic' },
      { step: 3, instruction: 'Remove infected leaves and stagheads', estimated_time: 'As detected', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Potassium Sulphate', type: 'chemical', dosage: '30 kg/ha', timing: 'At branching stage', price: '₹25/kg' }
    ],
    prevention: ['Grow tolerant varieties', 'Follow 3-year crop rotation', 'Avoid excess nitrogen', 'Optimize plant spacing', 'Deep summer plowing'],
    seasonal: 'rabi',
    regions: ['Rajasthan', 'Uttar Pradesh', 'Haryana', 'Punjab', 'Madhya Pradesh', 'West Bengal'],
    imageUrls: ['https://example.com/white-rust.jpg']
  },
  {
    name: 'Mustard Downy Mildew',
    commonNames: ['Peronospora Downy Mildew'],
    cropType: 'Mustard',
    description: 'Fungal disease caused by Peronospora parasitica, common in cool humid conditions.',
    symptoms: ['Pale green/yellow angular spots on leaves', 'White/purplish downy growth on lower surface', 'Lesions turn brown and dry', 'Stunted plant growth', 'Premature leaf fall'],
    causes: ['Cool temperatures (10-15°C)', 'High humidity', 'Overcast weather', 'Dense crop canopy', 'Poor air circulation'],
    severity: 'moderate',
    treatment: [
      { step: 1, instruction: 'Apply Dimethomorph 50WP at 0.5g/L or Cymoxanil 1g/L', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Spray sour buttermilk 10% (1L/10L water)', estimated_time: 'Every 10 days', method: 'organic' },
      { step: 3, instruction: 'Improve spacing for air circulation', estimated_time: 'At planting/ongoing', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Mono Potassium Phosphate', type: 'chemical', dosage: '5g/L foliar', timing: 'Weekly', price: '₹50/kg' }
    ],
    prevention: ['Grow tolerant varieties', 'Wider row spacing (45cm)', 'Avoid excess irrigation', 'Avoid nitrogen late in season', 'Crop rotation with cereals'],
    seasonal: 'rabi',
    regions: ['Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Haryana', 'Punjab'],
    imageUrls: ['https://example.com/downy-mildew-mustard.jpg']
  },
  // Chilli diseases
  {
    name: 'Chilli Leaf Spot',
    commonNames: ['Cercospora Leaf Spot', 'Frogeye Leaf Spot'],
    cropType: 'Chilli',
    description: 'Fungal disease caused by Cercospora capsici affecting foliage.',
    symptoms: ['Small circular spots with gray centers', 'Dark brown/purple margins', 'Spots coalesce causing leaf blight', 'Premature defoliation', 'Reduced fruit yield'],
    causes: ['Warm humid weather', 'High rainfall', 'Dense planting', 'Infected seeds', 'Continuous chilli cultivation'],
    severity: 'moderate',
    treatment: [
      { step: 1, instruction: 'Spray Carbendazim 1g/L or Mancozeb 2.5g/L', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Spray Trichoderma formulation 5ml/L', estimated_time: 'Every 15 days', method: 'organic' },
      { step: 3, instruction: 'Remove affected lower leaves', estimated_time: 'Weekly', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Potassium Nitrate', type: 'chemical', dosage: '10g/L foliar', timing: 'At fruiting stage', price: '₹40/kg' }
    ],
    prevention: ['Use disease-free seeds', 'Seed treatment with Thiram 2g/kg', 'Follow 2-3 year crop rotation', 'Adequate plant spacing', 'Remove crop debris'],
    seasonal: 'kharif',
    regions: ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Madhya Pradesh'],
    imageUrls: ['https://example.com/chilli-spot.jpg']
  },
  // Sorghum diseases
  {
    name: 'Sorghum Grain Mold',
    commonNames: ['Grain Mold', 'Head Mold'],
    cropType: 'Sorghum',
    description: 'Complex fungal disease affecting grains during maturation, caused by multiple fungi.',
    symptoms: ['Pink/orange/gray fungal growth on grains', 'Discolored and shriveled grains', 'Lightweight grains', 'Germination loss in seeds', 'Mycotoxin contamination'],
    causes: ['Rainfall during grain maturation', 'High humidity (>85%)', 'Temperatures 25-30°C', 'Compact panicles', 'Susceptible hybrids'],
    severity: 'high',
    treatment: [
      { step: 1, instruction: 'Apply Azoxystrobin 23SC at 1ml/L at flowering', estimated_time: 'At 50% flowering', method: 'chemical' },
      { step: 2, instruction: 'Early harvesting immediately after physiological maturity', estimated_time: 'As soon as grains mature', method: 'preventive' },
      { step: 3, instruction: 'Dry grains to 12% moisture quickly', estimated_time: 'After harvest', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Calcium Nitrate', type: 'chemical', dosage: '10g/L foliar', timing: 'At grain filling', price: '₹35/kg' }
    ],
    prevention: ['Grow mold-tolerant hybrids', 'Avoid late sowing', 'Early harvesting at maturity', 'Proper grain drying', 'Spray fungicide at flowering'],
    seasonal: 'kharif',
    regions: ['Maharashtra', 'Karnataka', 'Telangana', 'Andhra Pradesh', 'Madhya Pradesh', 'Tamil Nadu'],
    imageUrls: ['https://example.com/grain-mold.jpg']
  },
  // Onion diseases
  {
    name: 'Onion Purple Blotch',
    commonNames: ['Purple Blotch', 'Alternaria Leaf Blight'],
    cropType: 'Onion',
    description: 'Fungal disease caused by Alternaria porri, significant in bulb production.',
    symptoms: ['Small white sunken spots on leaves', 'Purple/brown concentric rings', 'Lesions expand causing leaf dieback', 'Infection moves to bulb neck', 'Reduced bulb size'],
    causes: ['Warm humid weather (25-30°C)', 'Heavy dew and rainfall', 'Excess nitrogen', 'Thrips damage predisposes infection', 'Dense planting'],
    severity: 'high',
    treatment: [
      { step: 1, instruction: 'Spray Mancozeb 2.5g/L or Difenoconazole 0.5ml/L', estimated_time: 'Immediately', method: 'chemical' },
      { step: 2, instruction: 'Spray neem oil 3ml/L + baking soda 2g/L', estimated_time: 'Every 10 days', method: 'organic' },
      { step: 3, instruction: 'Remove severely infected leaves', estimated_time: 'Weekly', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Potassium Sulphate', type: 'chemical', dosage: '50 kg/ha', timing: 'At bulb formation', price: '₹25/kg' }
    ],
    prevention: ['Grow tolerant varieties', 'Follow 2-3 year rotation', 'Avoid dense planting', 'Control thrips regularly', 'Remove crop debris'],
    seasonal: 'rabi',
    regions: ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Madhya Pradesh', 'Bihar'],
    imageUrls: ['https://example.com/purple-blotch.jpg']
  },
  // Mango diseases
  {
    name: 'Mango Anthracnose',
    commonNames: ['Black Spot', 'Blossom Blight'],
    cropType: 'Mango',
    description: 'Fungal disease caused by Colletotrichum gloeosporioides, major post-harvest disease.',
    symptoms: ['Black/brown irregular spots on leaves', 'Blossom blight and flower drop', 'Black sunken lesions on fruits', 'Fruit rotting in storage', 'Twig dieback'],
    causes: ['High humidity and rainfall', 'Temperatures 25-30°C', 'Dense canopy', 'Orchard sanitation issues', 'Rain during flowering/fruiting'],
    severity: 'high',
    treatment: [
      { step: 1, instruction: 'Spray Carbendazim 1g/L + Mancozeb 2g/L at flowering', estimated_time: 'At panicle emergence', method: 'chemical' },
      { step: 2, instruction: 'Pre-harvest spray of Copper oxychloride 2.5g/L', estimated_time: '15 days before harvest', method: 'chemical' },
      { step: 3, instruction: 'Hot water treatment of fruits at 52°C for 10 min', estimated_time: 'After harvest', method: 'organic' },
      { step: 4, instruction: 'Prune dead/diseased branches', estimated_time: 'After harvest season', method: 'preventive' }
    ],
    fertilizers: [
      { name: 'Potassium Sulphate', type: 'chemical', dosage: '500g/tree', timing: 'Before flowering', price: '₹25/kg' }
    ],
    prevention: ['Prune for good canopy aeration', 'Spray Bordeaux mixture 1% before flowering', 'Remove fallen fruits and leaves', 'Use disease-free nursery plants', 'Avoid overhead irrigation'],
    seasonal: 'all',
    regions: ['Uttar Pradesh', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Karnataka', 'Maharashtra'],
    imageUrls: ['https://example.com/anthracnose.jpg']
  },
  // Banana diseases
  {
    name: 'Banana Fusarium Wilt',
    commonNames: ['Panama Disease', 'Fusarium Wilt'],
    cropType: 'Banana',
    description: 'Devastating fungal disease caused by Fusarium oxysporum f.sp. cubense, including TR4 strain.',
    symptoms: ['Yellowing of lower leaves spreading inward', 'Leaf splitting along midrib', 'Pseudostem cracking', 'Internal vascular discoloration (red/brown)', 'Complete wilting and death'],
    causes: ['Soil-borne fungus', 'Temperature 25-30°C', 'Poor drainage', 'Infected suckers/rhizomes', 'Soil with nematode damage'],
    severity: 'critical',
    treatment: [
      { step: 1, instruction: 'Drench soil with Carbendazim 1g/L + Copper oxychloride 2g/L', estimated_time: 'At first symptoms', method: 'chemical' },
      { step: 2, instruction: 'Inject Trichoderma harzianum 10ml into pseudostem', estimated_time: 'Every 2 months', method: 'organic' },
      { step: 3, instruction: 'Remove and destroy infected plants with roots', estimated_time: 'Immediately', method: 'preventive' },
      { step: 4, instruction: 'Apply neem cake 1kg + FYM 5kg per pit', estimated_time: 'At planting', method: 'organic' }
    ],
    fertilizers: [
      { name: 'Vermicompost', type: 'organic', dosage: '10kg/plant/year', timing: 'Split doses throughout year', price: '₹8/kg' }
    ],
    prevention: ['Use tissue-culture disease-free plants', 'Follow strict quarantine', 'Grow resistant varieties like Grand Naine', 'Solarize soil before planting', 'Avoid waterlogging'],
    seasonal: 'all',
    regions: ['Tamil Nadu', 'Maharashtra', 'Gujarat', 'Andhra Pradesh', 'Karnataka', 'Madhya Pradesh'],
    imageUrls: ['https://example.com/panama.jpg']
  }
];

module.exports = diseases;
