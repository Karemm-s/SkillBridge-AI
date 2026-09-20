import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. SETUP LINGKUNGAN & PATH ES MODULE
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 2. MIDDLEWARE CONFIGURATION
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 3. MULTER STORAGE CONFIG (MEMORI)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Hanya dokumen PDF yang diperbolehkan.'));
    }
  }
});

// 4. INISIALISASI GEMINI AI
const apiKey = process.env.GEMINI_API_KEY;
const genAI = (apiKey && apiKey !== 'YOUR_API_KEY_HERE') ? new GoogleGenerativeAI(apiKey) : null;

// =========================================================================
// HELPER: EKSTRAKSI KATA KUNCI SPESIFIK DARI TEKS CV
// =========================================================================
function extractSkillsFromText(text = '') {
  if (!text || text.length < 20) return [];

  const skillDictionary = [
    ['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['python', 'Python'],
    ['java', 'Java'], ['html', 'HTML'], ['css', 'CSS'], ['sql', 'SQL'],
    ['react', 'React'], ['node.js', 'Node.js'], ['php', 'PHP'], ['figma', 'Figma'],
    ['excel', 'Microsoft Excel'], ['power bi', 'Power BI'], ['tableau', 'Tableau'],
    ['google analytics', 'Google Analytics'], ['seo', 'SEO'], ['copywriting', 'Copywriting'],
    ['content writing', 'Content Writing'], ['social media', 'Social Media'],
    ['digital marketing', 'Digital Marketing'], ['public speaking', 'Public Speaking'],
    ['data analysis', 'Data Analysis'], ['machine learning', 'Machine Learning'],
    ['project management', 'Project Management'], ['communication', 'Komunikasi'],
    ['leadership', 'Leadership'], ['research', 'Research'], ['riset', 'Riset'],
    ['design', 'Design'], ['editing', 'Editing']
  ];
  const normalizedText = text.toLowerCase();

  return skillDictionary
    .filter(([keyword]) => new RegExp(`(^|[^a-z0-9])${keyword.replace(/[.+]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(normalizedText))
    .map(([, label]) => label)
    .slice(0, 5);
}

function calculateMatchScore(pdfText = '', targetKarir = '', category = null) {
  const normalizedText = pdfText.toLowerCase();
  const targetTerms = targetKarir.toLowerCase().match(/[a-z0-9]+/g) || [];
  const categoryTerms = category ? category.keywords : [];
  const relevantTerms = [...new Set([...targetTerms, ...categoryTerms])]
    .filter(term => term.length > 3);
  const matchingTerms = relevantTerms.filter(term => normalizedText.includes(term));
  const extractedSkillCount = extractSkillsFromText(pdfText).length;

  if (!pdfText.trim()) return 45;

  return Math.min(
    95,
    40 + (matchingTerms.length * 8) + (extractedSkillCount * 2)
  );
}

// =========================================================================
// ENGINE DYNAMIC MOCK DATA (OFFLINE / FALLBACK MODE)
// =========================================================================
function generateSmartMockData(jurusan = '', targetKarir = '', pdfText = '') {
  const jurusanClean = jurusan.trim() || 'Latar Belakang Umum';
  const targetClean = targetKarir.trim() || 'Target Karir';
  const targetLower = targetClean.toLowerCase();

  // Ekstrak skill riil dari teks CV jika ada
  const cvSkills = extractSkillsFromText(pdfText);
  
  // Mapping Kategori Karir Populer
  const categories = [
    {
      id: 'pendidikan',
      keywords: ['guru', 'pengajar', 'dosen', 'tutor', 'pendidik', 'instruktur', 'edukator', 'tentor'],
      matchScore: 85,
      defaultSkills: ["Komunikasi & Edukasi", "Penyusunan Materi Ajar", "Manajemen Kelas", "Pemahaman Psikologi Belajar"],
      gaps: [
        { name: "Penyusunan RPP & Kurikulum Merdeka", score: 45, status: "Perlu Ditingkatkan" },
        { name: "Penguasaan Media & Tools EdTech", score: 70, status: "Cukup Baik" },
        { name: "Sertifikasi Pendidik / PPG", score: 20, status: "Belum Ada" }
      ],
      opps: [
        { type: "MAGANG", title: `Asisten ${targetClean} / Intern`, company: "Institusi Pendidikan / Sekolah", location: "Onsite" },
        { type: "PELATIHAN", title: "Sertifikasi Pedagogi & Metode Mengajar", company: "Platform Edukasi", location: "Online" }
      ],
      roadmap: [
        { week: 1, title: "Pahami Kurikulum", description: "Pelajari Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP)." },
        { week: 2, title: "Penyusunan Modul", description: "Buat rancangan modul ajar dan bahan presentasi interaktif." },
        { week: 3, title: "Microteaching", description: "Latihan simulasi mengajar dengan pemanfaatan tools EdTech." },
        { week: 4, title: "Portofolio Ajar", description: "Kumpulkan dokumentasi materi ajar dan persiapkan berkas lamaran." }
      ]
    },
    {
      id: 'tech_data',
      keywords: ['data', 'analyst', 'developer', 'programmer', 'software', 'tech', 'it', 'web', 'cyber', 'backend', 'frontend'],
      matchScore: 82,
      defaultSkills: ["Logika Pemecahan Masalah", "Manajemen Database", "Analisis Sistem", "Interpretasi Data"],
      gaps: [
        { name: "Advanced Querying & SQL", score: 55, status: "Perlu Ditingkatkan" },
        { name: "Visualisasi Data (Tableau/Power BI)", score: 25, status: "Belum Ada" },
        { name: "Pemrograman & Scripting Dasar", score: 65, status: "Cukup Baik" }
      ],
      opps: [
        { type: "MAGANG", title: `${targetClean} Intern`, company: "PT Tech Nusantara", location: "Remote / Hybrid" },
        { type: "BOOTCAMP", title: `Intensive ${targetClean} Program`, company: "Tech Academy", location: "1-3 Bulan" }
      ],
      roadmap: [
        { week: 1, title: "Fondasi Teknis", description: "Kuasai sintaks dasar dan konsep arsitektur target." },
        { week: 2, title: "Studi Kasus", description: "Selesaikan latihan manipulasi data dan logika aplikasi." },
        { week: 3, title: "Proyek Mandiri", description: "Bangun satu proyek end-to-end yang berfungsi penuh." },
        { week: 4, title: "Publikasi Portofolio", description: "Dokumentasikan kode di GitHub dan perbarui profil LinkedIn." }
      ]
    }
  ];

  // Cari match kategori
  const matched = categories.find(cat => cat.keywords.some(k => targetLower.includes(k)));
  
  // Tentukan transferable skills (Gabungkan hasil ekstraksi CV jika ada)
  const finalSkills = cvSkills.length >= 2 
    ? cvSkills 
    : (matched ? matched.defaultSkills : ["Komunikasi & Adaptabilitas", "Penyelesaian Masalah", "Manajemen Waktu", `Dasar Bidang ${targetClean}`]);

  if (matched) {
    return {
      jurusan: jurusanClean,
      targetKarir: targetClean,
      matchScore: calculateMatchScore(pdfText, targetClean, matched),
      summary: pdfText.length > 50 
        ? `Berdasarkan isi CV, kamu memiliki modal kompetensi pada (${finalSkills.slice(0, 3).join(', ')}) yang siap ditransformasikan ke peran ${targetClean}.`
        : `Latar belakang ${jurusanClean} memberikan fondasi yang baik untuk bertransisi menjadi ${targetClean}.`,
      transferableSkills: finalSkills,
      skillGap: matched.gaps,
      opportunities: matched.opps,
      roadmap: matched.roadmap
    };
  }

  // Universal Fallback untuk profesi apa pun di luar kategori
  return {
    jurusan: jurusanClean,
    targetKarir: targetClean,
    matchScore: calculateMatchScore(pdfText, targetClean),
    summary: pdfText.length > 50
      ? `CV kamu menunjukkan penguasaan (${finalSkills.slice(0, 3).join(', ')}) yang relevan untuk mendukung karir sebagai ${targetClean}.`
      : `Pola pikir & keterampilan dari ${jurusanClean} dapat dialihkan secara strategis ke posisi ${targetClean}.`,
    transferableSkills: finalSkills,
    skillGap: [
      { name: `Kompetensi Khusus ${targetClean}`, score: 40, status: "Perlu Ditingkatkan" },
      { name: `Penguasaan Perangkat Kerja ${targetClean}`, score: 30, status: "Perlu Ditingkatkan" },
      { name: "Sertifikasi Profesi Terkait", score: 15, status: "Belum Ada" }
    ],
    opportunities: [
      { type: "MAGANG", title: `Junior / Intern ${targetClean}`, company: `Instansi Bidang ${targetClean}`, location: "Hybrid / Onsite" },
      { type: "PELATIHAN", title: `Program Akselerasi ${targetClean}`, company: "Penyedia Pelatihan Terverifikasi", location: "Online" }
    ],
    roadmap: [
      { week: 1, title: "Riset Standardisasi", description: `Pahami kualifikasi utama dan alur kerja profesi ${targetClean}.` },
      { week: 2, title: "Tingkatkan Skill Gap", description: "Pelajari tools mendasar yang teridentifikasi belum ada di CV." },
      { week: 3, title: "Proyek Latihan", description: "Selesaikan 1 proyek praktis untuk menguji kemampuan teknis." },
      { week: 4, title: "Finalisasi Portofolio", description: "Kemas hasil karya dan perbarui CV untuk melamar kerja." }
    ]
  };
}

// =========================================================================
// API ENDPOINT ANALISIS KARIR
// =========================================================================
app.post('/api/analyze', upload.single('cv'), async (req, res) => {
  try {
    const { jurusan, targetKarir } = req.body;
    let pdfText = '';

    // A. EKSTRAKSI TEKS PDF
    if (req.file) {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        pdfText = (pdfData.text || '').trim();
        console.log(`📄 [PDF READ] Karakter terbaca: ${pdfText.length}`);
        
        if (pdfText.length === 0) {
          console.warn('⚠️ [PDF WARNING] File berupa hasil scan/gambar (tidak ada teks layer).');
        }
      } catch (pdfErr) {
        console.warn('⚠️ Gagal membaca PDF:', pdfErr.message);
      }
    }

    // B. ANALISIS MENGGUNAKAN GEMINI AI
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7
          }
        });

        const prompt = `
          Kamu adalah AI Career Analyst profesional.
          Analisislah data CV dan latar belakang pengguna secara mendalam dan spesifik.

          INPUT PENGGUNA:
          - Jurusan: "${jurusan || 'Tidak Diisi'}"
          - Target Karir: "${targetKarir || 'Rekomendasi Karir'}"
          - ISI TEKS CV PENGGUNA:
          """
          ${pdfText.substring(0, 4000) || 'TIDAK ADA TEKS CV / HASIL SCAN GAMBAR'}
          """

          PETUNJUK ANALISIS:
          1. JIKA TEKS CV ADA: Ambil nama skill, riwayat, atau teknologi nyata yang TERTULIS di CV untuk diisi ke "transferableSkills".
          2. SPESIFIKASI SKILL GAP: Tuliskan nama skill/tools spesifik yang BENAR-BENAR DIBUTUHKAN oleh peran "${targetKarir}" tetapi BELUM ADA di teks CV.
          3. KELUARAN JSON (Murni tanpa backticks markdown):

          {
            "jurusan": "${jurusan || 'Sesuai CV'}",
            "targetKarir": "${targetKarir}",
            "matchScore": number (35-95),
            "summary": "2 kalimat penjelasan spesifik korelasi CV dengan target karir.",
            "transferableSkills": ["skill 1 dari CV", "skill 2 dari CV", "skill 3 dari CV", "skill 4 dari CV"],
            "skillGap": [
              { "name": "Skill Krusial 1", "score": number (0-100), "status": "Belum Ada / Perlu Ditingkatkan" },
              { "name": "Skill Krusial 2", "score": number (0-100), "status": "Belum Ada / Perlu Ditingkatkan" },
              { "name": "Skill Krusial 3", "score": number (0-100), "status": "Belum Ada / Perlu Ditingkatkan" }
            ],
            "opportunities": [
              { "type": "MAGANG", "title": "...", "company": "...", "location": "..." },
              { "type": "BOOTCAMP", "title": "...", "company": "...", "location": "..." }
            ],
            "roadmap": [
              { "week": 1, "title": "...", "description": "..." },
              { "week": 2, "title": "...", "description": "..." },
              { "week": 3, "title": "...", "description": "..." },
              { "week": 4, "title": "...", "description": "..." }
            ]
          }
        `;

        const result = await model.generateContent(prompt);
        const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const aiData = JSON.parse(cleanJson);

        console.log(`✅ [GEMINI SUCCESS] Target: "${targetKarir}" | Score: ${aiData.matchScore}%`);
        return res.json({ success: true, data: aiData, source: 'gemini_ai' });

      } catch (aiErr) {
        console.error('⚠️ [GEMINI ERROR] Beralih ke Dynamic Mock Engine:', aiErr.message);
        const mockData = generateSmartMockData(jurusan, targetKarir, pdfText);
        return res.json({ success: true, data: mockData, source: 'mock_fallback' });
      }
    }

    // C. OFFLINE / MOCK MODE
    console.log(`ℹ️ [OFFLINE MODE] Memproses data dinamis.`);
    const mockData = generateSmartMockData(jurusan, targetKarir, pdfText);
    return res.json({ success: true, data: mockData, source: 'smart_mock' });

  } catch (err) {
    console.error('❌ Server Internal Error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memproses data di server.' });
  }
});

// =========================================================================
// JALANKAN SERVER
// =========================================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Server SkillBridge AI aktif di http://localhost:${PORT}`);
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    console.log('⚠️  [INFO] Running in Dynamic Offline Mode (GEMINI_API_KEY belum terpasang).\n');
  } else {
    console.log('✨ [INFO] Gemini AI Connected.\n');
  }
});