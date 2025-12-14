import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
import joblib
import os

print("⏳ Memuat dataset...")
df = pd.read_csv("data_balita.csv")

# Encode jenis kelamin
gender_encoder = LabelEncoder()
df["Jenis Kelamin"] = gender_encoder.fit_transform(df["Jenis Kelamin"])

X = df[["Umur (bulan)", "Jenis Kelamin", "Tinggi Badan (cm)"]]
y = df["Status Gizi"]

X_train, _, y_train, _ = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = KNeighborsClassifier(n_neighbors=5)
model.fit(X_train, y_train)

os.makedirs("model", exist_ok=True)

joblib.dump(model, "model/knn_model.pkl")
joblib.dump(gender_encoder, "model/gender_encoder.pkl")

print("✅ Model & encoder berhasil disimpan")
