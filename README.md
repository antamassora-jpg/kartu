# EduCard Sync - SMKN 2 Tana Toraja

Sistem manajemen identitas digital modern yang mengintegrasikan pembuatan kartu pelajar, kartu ujian, dan ID card umum dengan sistem absensi real-time berbasis Cloud Firestore.

## Fitur Utama

- **Visual Card Editor**: Kustomisasi tata letak kartu (Drag & Drop) secara langsung dengan pengaturan warna dan tipografi.
- **Automated Attendance**: Sinkronisasi absensi harian dan ujian via Role Scanner berbasis QR Code.
- **Identity Tracer**: Verifikasi keabsahan kartu melalui portal publik dengan pencarian NIS/NISN.
- **Bulk PDF Generator**: Cetak dan unduh ratusan kartu secara massal dengan format standar ID Card.
- **Real-time Statistics**: Monitoring kehadiran harian dan ujian melalui diagram interaktif dua kategori.

## Teknologi

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Firebase Cloud Firestore & Firebase Authentication
- **Styling**: Tailwind CSS & Shadcn UI
- **Grafis**: Html2Canvas & jsPDF untuk rendering kartu ke PDF

## Cara Menjalankan Lokal

1. Clone repositori ini.
2. Jalankan `npm install`.
3. Konfigurasi Firebase di `src/firebase/config.ts`.
4. Jalankan `npm run dev`.

---
© 2026 SMKN 2 Tana Toraja. Dikembangkan untuk efisiensi administrasi sekolah digital.