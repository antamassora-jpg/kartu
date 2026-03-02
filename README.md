# EduCard Sync - SMKN 2 Tana Toraja

Sistem manajemen identitas digital modern yang mengintegrasikan pembuatan kartu pelajar, kartu ujian, dan ID card umum dengan sistem absensi real-time berbasis Cloud Firestore.

## Fitur Utama

- **Visual Card Editor**: Kustomisasi tata letak kartu (Drag & Drop) secara langsung.
- **Automated Attendance**: Sinkronisasi absensi harian dan ujian via Role Scanner.
- **Identity Tracer**: Verifikasi keabsahan kartu melalui QR Code unik.
- **Bulk PDF Generator**: Cetak dan unduh ratusan kartu secara massal dengan satu klik.
- **Real-time Statistics**: Monitoring kehadiran harian dan ujian melalui diagram interaktif.

## Teknologi

- **Framework**: Next.js 15 (App Router)
- **Database**: Firebase Cloud Firestore
- **Auth**: Firebase Authentication
- **Styling**: Tailwind CSS & Shadcn UI
- **Graphics**: Html2Canvas & jsPDF

## Cara Menjalankan Lokal

1. Clone repositori ini.
2. Jalankan `npm install`.
3. Konfigurasi Firebase di `src/firebase/config.ts`.
4. Jalankan `npm run dev`.

---
© 2026 SMKN 2 Tana Toraja.