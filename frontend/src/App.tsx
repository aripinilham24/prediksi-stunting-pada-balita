import { useState } from "react";
import { User, Calendar, Ruler, Activity } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

/* ================================
   TYPE RESPONSE DARI BACKEND
================================ */
interface PredictResponse {
  jenis_kelamin: string;
  usia: number;
  tinggi_badan: number;
  hasil_prediksi: string;
  keterangan: string;
  probabilitas: Record<string, number>;
}

function App() {
  const apiKey = import.meta.env.VITE_API_URL || 'prediksi-stunting-pada-balita-production-bd50.up.railway.app';

  const [formData, setFormData] = useState({
    jenis_kelamin: "",
    usia: "",
    tinggi_badan: "",
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  const showPredictionResult = (data: PredictResponse) => {
  const probHtml = data.probabilitas
    ? Object.entries(data.probabilitas)
        .map(
          ([label, value]) =>
            `<li><b>${label}</b>: ${value}%</li>`
        )
        .join('')
    : '<li>Probabilitas tidak tersedia</li>';

  Swal.fire({
    icon:
      data.hasil_prediksi === 'normal' || data.hasil_prediksi === 'tinggi'
        ? 'success'
        : 'warning',
    title: 'Hasil Prediksi Stunting',
    html: `
      <div style="text-align:left;font-size:14px">
        <p><b>Jenis Kelamin:</b> ${data.jenis_kelamin}</p>
        <p><b>Usia:</b> ${data.usia} bulan</p>
        <p><b>Tinggi Badan:</b> ${data.tinggi_badan} cm</p>

        <hr/>

        <p><b>Status Gizi:</b> 
          <span style="font-weight:bold">
            ${data.hasil_prediksi}
          </span>
        </p>

        <p><b>Keterangan:</b><br/>
          ${data.keterangan}
        </p>

        <hr/>

        <p><b>Probabilitas Prediksi:</b></p>
        <ul style="padding-left:16px">
          ${probHtml}
        </ul>
      </div>
    `,
    confirmButtonText: 'Tutup'
  });
};


  /* ================================
     HANDLE SUBMIT
  ================================ */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.jenis_kelamin || !formData.usia || !formData.tinggi_badan) {
      await Swal.fire({
        icon: "warning",
        title: "Form Belum Lengkap",
        text: "Lengkapi semua form terlebih dahulu",
      });
      setSubmitting(false);
      return;
    }

    try {
      const response = await axios.post<PredictResponse>(`${apiKey}/predict`, {
        jenis_kelamin: formData.jenis_kelamin,
        usia: Number(formData.usia),
        tinggi_badan: Number(formData.tinggi_badan),
      });

      showPredictionResult(response.data);
    } catch (error: unknown) {
      let message = "Terjadi kesalahan pada server";

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || error.message || message;
      }

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: 'Terjadi kesalahan server!',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ================================
     HANDLE CHANGE
  ================================ */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
            <Activity className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Prediksi Stunting Pada Balita
          </h1>
          <p className="text-gray-600">
            Isi data balita untuk mengetahui risiko stunting
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
        >
          {/* JENIS KELAMIN */}
          <div>
            <label className="flex items-center text-gray-700 font-semibold mb-2">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              Jenis Kelamin
            </label>
            <select
              name="jenis_kelamin"
              value={formData.jenis_kelamin}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 rounded-lg"
            >
              <option value="">Pilih Jenis Kelamin</option>
              <option value="laki-laki">Laki-Laki</option>
              <option value="perempuan">Perempuan</option>
            </select>
          </div>

          {/* USIA */}
          <div>
            <label className="flex items-center text-gray-700 font-semibold mb-2">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              Usia (bulan)
            </label>
            <input
              type="number"
              name="usia"
              min={0}
              max={60}
              value={formData.usia}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 rounded-lg"
            />
          </div>

          {/* TINGGI BADAN */}
          <div>
            <label className="flex items-center text-gray-700 font-semibold mb-2">
              <div className="p-2 bg-pink-100 rounded-lg mr-3">
                <Ruler className="w-5 h-5 text-pink-600" />
              </div>
              Tinggi Badan (cm)
            </label>
            <input
              type="number"
              name="tinggi_badan"
              step="0.1"
              value={formData.tinggi_badan}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 rounded-lg"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold py-4 rounded-lg"
          >
            {submitting ? "Memproses..." : "Prediksi Sekarang"}
          </button>
        </form>

        {/* INFO */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <b>💡 Informasi:</b> Stunting adalah kondisi gagal tumbuh pada anak
            akibat kekurangan gizi kronis. Deteksi dini sangat penting.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
