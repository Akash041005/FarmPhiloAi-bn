import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import os
import sys

print("=" * 60)
print("CROP RECOMMENDATION MODEL TRAINING")
print("=" * 60)

dataset_path = 'dataset/Crop_recommendation.csv'
use_synthetic = False

if os.path.exists(dataset_path):
    df = pd.read_csv(dataset_path)
    print(f"Loaded real dataset: {len(df)} samples, {len(df['label'].unique())} crop types")
else:
    use_synthetic = True
    print(f"Dataset not found at {dataset_path}")
    print("Generating high-quality synthetic dataset...")
    
    np.random.seed(42)
    samples_per_crop = 200
    
    crop_profiles = {
        'rice':       {'N':(80,10), 'P':(50,10), 'K':(45,10), 'temp':(28,3), 'hum':(80,5), 'ph':(6.5,0.5), 'rain':(220,30)},
        'wheat':      {'N':(70,10), 'P':(55,10), 'K':(50,10), 'temp':(22,3), 'hum':(55,5), 'ph':(7.0,0.5), 'rain':(90,20)},
        'maize':      {'N':(75,10), 'P':(60,10), 'K':(55,10), 'temp':(26,3), 'hum':(65,5), 'ph':(6.8,0.5), 'rain':(140,25)},
        'cotton':     {'N':(65,10), 'P':(55,10), 'K':(60,10), 'temp':(32,3), 'hum':(70,5), 'ph':(7.2,0.5), 'rain':(120,25)},
        'sugarcane':  {'N':(85,10), 'P':(60,10), 'K':(70,10), 'temp':(30,3), 'hum':(78,5), 'ph':(6.8,0.5), 'rain':(200,30)},
        'groundnut':  {'N':(30,8),  'P':(65,10), 'K':(40,8),  'temp':(28,3), 'hum':(60,5), 'ph':(6.2,0.5), 'rain':(110,20)},
        'jute':       {'N':(55,10), 'P':(40,10), 'K':(35,10), 'temp':(33,3), 'hum':(82,5), 'ph':(6.5,0.5), 'rain':(250,30)},
        'mungbean':   {'N':(35,8),  'P':(55,10), 'K':(30,8),  'temp':(30,3), 'hum':(60,5), 'ph':(6.8,0.5), 'rain':(100,20)},
        'blackgram':  {'N':(30,8),  'P':(50,10), 'K':(35,8),  'temp':(31,3), 'hum':(62,5), 'ph':(6.5,0.5), 'rain':(95,20)},
        'lentil':     {'N':(25,8),  'P':(45,8),  'K':(25,8),  'temp':(20,3), 'hum':(50,5), 'ph':(7.0,0.5), 'rain':(70,15)},
        'pomegranate':{'N':(45,10), 'P':(35,10), 'K':(55,10), 'temp':(30,4), 'hum':(55,8), 'ph':(6.8,0.5), 'rain':(130,30)},
        'banana':     {'N':(90,10), 'P':(45,10), 'K':(80,10), 'temp':(30,3), 'hum':(78,5), 'ph':(6.5,0.5), 'rain':(200,30)},
        'mango':      {'N':(50,10), 'P':(35,10), 'K':(60,10), 'temp':(32,4), 'hum':(60,8), 'ph':(6.2,0.5), 'rain':(160,35)},
        'grapes':     {'N':(45,10), 'P':(40,10), 'K':(65,10), 'temp':(27,4), 'hum':(55,8), 'ph':(6.8,0.5), 'rain':(100,25)},
        'watermelon': {'N':(40,10), 'P':(55,10), 'K':(60,10), 'temp':(30,3), 'hum':(65,5), 'ph':(6.5,0.5), 'rain':(120,25)},
        'muskmelon':  {'N':(45,10), 'P':(50,10), 'K':(55,10), 'temp':(28,3), 'hum':(62,5), 'ph':(6.8,0.5), 'rain':(110,20)},
        'apple':      {'N':(55,10), 'P':(40,10), 'K':(50,10), 'temp':(18,4), 'hum':(60,8), 'ph':(6.5,0.5), 'rain':(120,25)},
        'orange':     {'N':(50,10), 'P':(40,10), 'K':(55,10), 'temp':(26,4), 'hum':(65,8), 'ph':(6.2,0.5), 'rain':(150,30)},
        'papaya':     {'N':(70,10), 'P':(45,10), 'K':(65,10), 'temp':(32,3), 'hum':(72,5), 'ph':(6.8,0.5), 'rain':(180,30)},
        'coconut':    {'N':(60,10), 'P':(40,10), 'K':(70,10), 'temp':(32,3), 'hum':(80,5), 'ph':(6.2,0.5), 'rain':(240,30)},
        'coffee':     {'N':(55,10), 'P':(35,10), 'K':(50,10), 'temp':(22,4), 'hum':(75,8), 'ph':(6.0,0.5), 'rain':(200,30)},
        'kidneybeans':{'N':(35,8),  'P':(50,10), 'K':(30,8),  'temp':(24,3), 'hum':(55,5), 'ph':(6.8,0.5), 'rain':(85,20)},
    }
    
    data = []
    for crop, params in crop_profiles.items():
        n = samples_per_crop
        for _ in range(n):
            N = np.random.normal(params['N'][0], params['N'][1])
            P = np.random.normal(params['P'][0], params['P'][1])
            K = np.random.normal(params['K'][0], params['K'][1])
            temp = np.random.normal(params['temp'][0], params['temp'][1])
            hum = np.random.normal(params['hum'][0], params['hum'][1])
            ph = np.random.normal(params['ph'][0], params['ph'][1])
            rain = np.random.normal(params['rain'][0], params['rain'][1])
            data.append([max(0,N), max(0,P), max(0,K), max(5,min(50,temp)), max(10,min(100,hum)), max(3.5,min(9.9,ph)), max(10,min(400,rain)), crop])
    
    df = pd.DataFrame(data, columns=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'label'])
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    print(f"Created synthetic dataset with {len(df)} samples and {len(df['label'].unique())} crop types")

print(f"\nFeatures: {list(df.columns[:-1])}")
print(f"Target classes ({len(df['label'].unique())}): {sorted(df['label'].unique())}")
print(f"\nDataset preview:")
print(df.head())

X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']].values
y = df['label'].values

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"\nTraining set: {len(X_train)} samples")
print(f"Test set: {len(X_test)} samples")

print("\nTraining Random Forest Classifier...")
rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_split=3,
    min_samples_leaf=1,
    random_state=42,
    class_weight='balanced',
    n_jobs=-1
)
rf_model.fit(X_train_scaled, y_train)

y_pred = rf_model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n{'=' * 40}")
print(f"MODEL EVALUATION")
print(f"{'=' * 40}")
print(f"Accuracy: {accuracy * 100:.2f}%")
print(f"\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_, zero_division=0))

os.makedirs('models', exist_ok=True)
joblib.dump(rf_model, 'models/crop_recommendation.pkl')
joblib.dump(label_encoder, 'models/label_encoder.pkl')
joblib.dump(scaler, 'models/scaler.pkl')
print(f"\nModel saved to models/crop_recommendation.pkl")
print(f"Encoder saved to models/label_encoder.pkl")
print(f"Scaler saved to models/scaler.pkl")

feature_importance = sorted(zip(['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'], rf_model.feature_importances_), key=lambda x: x[1], reverse=True)
print(f"\nFeature Importance:")
for feature, importance in feature_importance:
    print(f"  {feature:15s}: {importance * 100:.2f}%")

print(f"\n{'=' * 40}")
print(f"TRAINING COMPLETE!")
print(f"{'=' * 40}")
print(f"Model: Random Forest Classifier")
print(f"Classes: {len(label_encoder.classes_)} crop types")
print(f"Test Accuracy: {accuracy * 100:.2f}%")
print(f"\nTo use: python predict.py '<json_input>'")
