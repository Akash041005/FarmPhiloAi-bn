from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

try:
    model = joblib.load('models/crop_recommendation.pkl')
    encoder = joblib.load('models/label_encoder.pkl')
    print("Models loaded successfully")
except Exception as e:
    print(f"Error loading models: {e}")
    model = None
    encoder = None

@app.route('/predict', methods=['POST'])
def predict():
    if model is None or encoder is None:
        return jsonify({'error': 'Models not loaded'}), 500
    
    data = request.json
    features = np.array([[
        data['N'], data['P'], data['K'],
        data['temperature'], data['humidity'],
        data['ph'], data['rainfall']
    ]])
    
    probabilities = model.predict_proba(features)[0]
    top3_indices = np.argsort(probabilities)[-3:][::-1]
    
    recommendations = []
    for idx in top3_indices:
        crop = encoder.inverse_transform([idx])[0]
        recommendations.append({
            'crop': crop.title() if crop.islower() else crop,
            'confidence': round(float(probabilities[idx]) * 100, 2)
        })
    
    return jsonify({
        'recommendations': recommendations,
        'input': data
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model': 'RandomForest',
        'classes': len(encoder.classes_) if encoder else 0
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
