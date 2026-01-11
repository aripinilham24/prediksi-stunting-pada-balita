from pathlib import Path
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict

BASE_DIR = Path(__file__).resolve().parent.parent

model = joblib.load(BASE_DIR / "model" / "knn_model.pkl")
gender_encoder = joblib.load(BASE_DIR / "model" / "gender_encoder.pkl")

app = FastAPI(title="API Prediksi Stunting", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    jenis_kelamin: str
    usia: int = Field(..., ge=1, le=60)
    tinggi_badan: float = Field(..., gt=30, lt=150)

class PredictResponse(BaseModel):
    jenis_kelamin: str
    usia: int
    tinggi_badan: float
    hasil_prediksi: str
    keterangan: str
    probabilitas: Optional[Dict[str, float]]

KETERANGAN_STATUS = {
    "severely stunted": "⚠ Sangat pendek parah",
    "stunted": "⚠ Pendek",
    "normal": "✔ Normal",
    "tinggi": "✔ Tinggi"
}

@app.post("/predict", response_model=PredictResponse)
def predict(data: PredictRequest):
    try:
        jk = data.jenis_kelamin.lower()
        jk_encoded = gender_encoder.transform([jk])[0]

        X = np.array([[data.usia, jk_encoded, data.tinggi_badan]])
        hasil = model.predict(X)[0]

        probabilitas = None
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X)[0]
            probabilitas = {
                model.classes_[i]: round(float(probs[i]) * 100, 2)
                for i in range(len(probs))
            }

        return {
            "jenis_kelamin": data.jenis_kelamin,
            "usia": data.usia,
            "tinggi_badan": data.tinggi_badan,
            "hasil_prediksi": str(hasil),
            "keterangan": KETERANGAN_STATUS.get(hasil),
            "probabilitas": probabilitas
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
