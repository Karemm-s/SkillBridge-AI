# SkillBridge AI

SkillBridge AI adalah aplikasi web untuk membantu pengguna menganalisis potensi karir berdasarkan jurusan, target pekerjaan, dan CV yang diupload. Aplikasi ini menilai keterampilan yang bisa ditransfer, mengidentifikasi skill gap, dan menyarankan roadmap belajar yang relevan.

## Fitur Utama

- Upload CV dalam format PDF
- Analisis jurusan dan target karir
- Deteksi transferable skill dari teks CV
- Identifikasi skill gap dan kebutuhan pembelajaran
- Rekomendasi peluang magang dan pelatihan
- Roadmap belajar 4 minggu
- Dashboard hasil analisis yang mudah dibaca
- Fallback mode otomatis bila AI tidak tersedia

## Stack Teknologi

- Frontend: HTML, Tailwind CSS, JavaScript
- Backend: Node.js, Express
- PDF parsing: pdf-parse
- AI: Google Gemini API
- Upload file: Multer

## Struktur Project

```bash
SkillBridge-AI/
├── public/
│   ├── index.html
│   ├── dashboard.html
│   └── analyze.html
├── uploads/
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
├── README.md
└── .env
```

## Prasyarat

Pastikan perangkat Anda sudah memiliki:

- Node.js v18+
- npm
- Akun Google AI / Gemini API key (opsional, untuk analisis AI yang lebih akurat)

## Instalasi

1. Clone repository:

```bash
git clone <url-repository>
cd SkillBridge-AI
```

2. Install dependency:

```bash
npm install
```

3. Buat file `.env` di root project dan isi variable berikut:

```bash
PORT=3000
GEMINI_API_KEY=your_api_key_here
```

> Jika `GEMINI_API_KEY` tidak diisi atau masih default, aplikasi akan berjalan di mode fallback/mock analysis.

## Menjalankan Aplikasi

Jalankan server dengan perintah berikut:

```bash
npm start
```

Atau mode development:

```bash
npm run dev
```

Setelah server berjalan, buka browser ke:

```bash
http://localhost:3000
```

## Alur Penggunaan

1. Buka halaman utama.
2. Upload CV PDF atau isi data manual.
3. Masukkan jurusan dan target karir.
4. Klik tombol analisis.
5. Sistem akan menampilkan hasil rekomendasi di dashboard.

## Endpoint API

### POST /api/analyze

Endpoint utama untuk menganalisis data pengguna.

Request body:
- `cv` (file PDF, opsional)
- `jurusan` (string)
- `targetKarir` (string)

Response:
- `success: true/false`
- `data` berisi:
  - `jurusan`
  - `targetKarir`
  - `matchScore`
  - `summary`
  - `transferableSkills`
  - `skillGap`
  - `opportunities`
  - `roadmap`

## Catatan Keamanan

- Jangan pernah menyimpan API key di repository GitHub.
- File `.env` sudah disarankan untuk diabaikan dari Git menggunakan `.gitignore`.
- Pastikan token API Anda aman dan hanya digunakan di environment lokal atau deployment yang aman.

## Lisensi

Proyek ini dibuat untuk kebutuhan demo dan kompetisi pengembangan web, dan dapat dikembangkan lebih lanjut sesuai kebutuhan tim.

## Kontributor

- SkillBridge AI Team
