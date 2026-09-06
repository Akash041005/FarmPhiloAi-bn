import joblib
import numpy as np
import json
import sys
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models/crop_recommendation.pkl')
ENCODER_PATH = os.path.join(os.path.dirname(__file__), 'models/label_encoder.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), 'models/scaler.pkl')

def load_models():
    model = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
    scaler = joblib.load(SCALER_PATH) if os.path.exists(SCALER_PATH) else None
    return model, encoder, scaler

def predict(features):
    model, encoder, scaler = load_models()
    input_array = np.array([[
        features['N'], features['P'], features['K'],
        features['temperature'], features['humidity'],
        features['ph'], features['rainfall']
    ]])
    
    if scaler:
        input_array = scaler.transform(input_array)
    
    probabilities = model.predict_proba(input_array)[0]
    top3_indices = np.argsort(probabilities)[-3:][::-1]
    crop_names = encoder.classes_
    
    recommendations = []
    all_confidences = {}
    
    for idx in top3_indices:
        crop = crop_names[idx]
        confidence = round(float(probabilities[idx]) * 100, 2)
        recommendations.append({
            'crop': str(crop).title() if str(crop).islower() else str(crop),
            'confidence': confidence
        })
    
    for idx in range(len(probabilities)):
        crop = crop_names[idx]
        conf = round(float(probabilities[idx]) * 100, 2)
        all_confidences[str(crop).title() if str(crop).islower() else str(crop)] = conf
    
    return {
        'recommendations': recommendations,
        'top_3': [r['crop'] for r in recommendations],
        'all_confidences': dict(sorted(all_confidences.items(), key=lambda x: x[1], reverse=True)[:10])
    }

if __name__ == '__main__':
    try:
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
            result = predict(input_data)
            print(json.dumps(result))
        else:
            print(json.dumps({'error': 'No input data provided'}))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
