import { Student, SchoolSettings, AttendanceSession, AttendanceLog, ExamEvent, CardTemplate } from './types';

const STORAGE_KEY = 'educard_sync_db';

export interface DB {
  students: Student[];
  school_settings: SchoolSettings;
  sessions: AttendanceSession[];
  logs: AttendanceLog[];
  exams: ExamEvent[];
  templates: CardTemplate[];
}

const DEFAULT_SETTINGS: SchoolSettings = {
  school_name: 'SMKN 2 Tana Toraja',
  address: 'Jl. Poros Makale-Rantepao, Tana Toraja',
  logo_left: 'https://iili.io/KAqSZhb.png',
  logo_right: 'https://picsum.photos/seed/dikdasmen/200/200',
  principal_name: 'Drs. Nama Kepala Sekolah, M.Pd.',
  principal_nip: '19700101 199501 1 001',
  signature_image: 'https://picsum.photos/seed/sig/200/100',
  stamp_image: 'https://picsum.photos/seed/stamp/200/200',
  terms_text: '1. Kartu wajib dibawa setiap hari.\n2. Dilarang dipinjamkan.\n3. Jika hilang segera lapor ke sekolah.\n4. Berlaku selama siswa aktif.\n5. Kartu dipakai untuk scan layanan/absen.',
};

const INITIAL_DB: DB = {
  students: [
    {
      id: '1',
      nis: '2021001',
      nisn: '0051234567',
      name: 'Andi Pratama',
      class: 'XII',
      major: 'Teknik Komputer & Jaringan',
      school_year: '2023/2024',
      photo_url: 'https://picsum.photos/seed/student1/300/400',
      status: 'Aktif',
      valid_until: '2024-06-30',
      card_code: 'CC-TKJ-001',
    },
    {
      id: '2',
      nis: '2021002',
      nisn: '0051234568',
      name: 'Budi Santoso',
      class: 'XII',
      major: 'Otomotif',
      school_year: '2023/2024',
      photo_url: 'https://picsum.photos/seed/student2/300/400',
      status: 'Aktif',
      valid_until: '2024-06-30',
      card_code: 'CC-OTO-002',
    }
  ],
  school_settings: DEFAULT_SETTINGS,
  sessions: [
    { id: 's1', name: 'Masuk', start_time: '07:00', late_after: '07:30' },
    { id: 's2', name: 'Pulang', start_time: '15:00' }
  ],
  logs: [],
  exams: [
    { id: 'e1', name: 'Ujian Tengah Semester Ganjil', school_year: '2023/2024', semester: 'Ganjil', start_date: '2023-10-01', end_date: '2023-10-10' }
  ],
  templates: [
    { id: 't1', type: 'STUDENT_CARD', name: 'Default Student Card', config_json: '{}', is_active: true },
    { id: 't2', type: 'EXAM_CARD', name: 'Default Exam Card', config_json: '{}', is_active: true }
  ]
};

export function getDB(): DB {
  if (typeof window === 'undefined') return INITIAL_DB;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB));
    return INITIAL_DB;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_DB;
  }
}

export function saveDB(db: DB) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
