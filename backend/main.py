from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import joblib
from typing import Optional, Dict

# =============================
# LOAD MODEL & ENCODER
# =============================
model = joblib.load("model/knn_model.pkl")
gender_encoder = joblib.load("model/gender_encoder.pkl")

app = FastAPI(
    title="API Prediksi Stunting Balita",
    version="1.0.0"
)

# =============================
# CORS
# =============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# REQUEST SCHEMA (Pydantic v2)
# =============================
class PredictRequest(BaseModel):
    jenis_kelamin: str = Field(..., description="laki-laki / perempuan")
    usia: int = Field(..., ge=1, le=60, description="Usia balita (bulan)")
    tinggi_badan: float = Field(..., gt=30, lt=150, description="Tinggi badan (cm)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "jenis_kelamin": "laki-laki",
                "usia": 24,
                "tinggi_badan": 80
            }
        }
    }

# =============================
# RESPONSE SCHEMA
# =============================
class PredictResponse(BaseModel):
    jenis_kelamin: str
    usia: int
    tinggi_badan: float
    hasil_prediksi: str
    keterangan: str
    probabilitas: Optional[Dict[str, float]]

# =============================
# ROOT
# =============================
@app.get("/")
def root():
    return {"message": "API Prediksi Stunting Aktif"}

# =============================
# PREDICT ENDPOINT
# =============================
KETERANGAN_STATUS = {
    "severely stunted": "⚠ Sangat pendek parah (risiko sangat tinggi, perlu penanganan segera!)",
    "stunted": "⚠ Pendek (indikasi stunting, perlu pemantauan gizi)",
    "normal": "✔ Normal (pertumbuhan baik)",
    "tinggi": "✔ Lebih tinggi dari rata-rata"
}
@app.post("/predict", response_model=PredictResponse)
def predict(data: PredictRequest):
    try:
        jk = data.jenis_kelamin.lower()

        if jk not in ["laki-laki", "perempuan"]:
            raise HTTPException(
                status_code=400,
                detail="Jenis kelamin harus 'laki-laki' atau 'perempuan'"
            )

        jk_encoded = gender_encoder.transform([jk])[0]

        input_df = pd.DataFrame([{
            "Umur (bulan)": data.usia,
            "Jenis Kelamin": jk_encoded,
            "Tinggi Badan (cm)": data.tinggi_badan
        }])

        hasil = model.predict(input_df)[0]

        probabilitas = None
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(input_df)[0]
            labels = model.classes_
            probabilitas = {
                labels[i]: round(probs[i] * 100, 2)
                for i in range(len(labels))
            }

        return {
            "jenis_kelamin": data.jenis_kelamin,
            "usia": data.usia,
            "tinggi_badan": data.tinggi_badan,
            "hasil_prediksi": hasil,
            "keterangan": KETERANGAN_STATUS.get(
                hasil, "Keterangan tidak tersedia"
            ),
            "probabilitas": probabilitas
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
