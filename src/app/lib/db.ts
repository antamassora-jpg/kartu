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

const DEFAULT_ASSET_L = 'https://iili.io/KAqSZhb.png';
const DEFAULT_LOGO_KEMENDIKBUD = 'https://iili.io/29vR0bV.png'; 
const DEFAULT_SIG = 'https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=200&h=100&auto=format&fit=crop';
const DEFAULT_STAMP = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=200&h=200&auto=format&fit=crop';

const DEFAULT_SETTINGS: SchoolSettings = {
  school_name: 'SMKN 2 Tana Toraja',
  address: 'Jl. Poros Makale-Rantepao, Tana Toraja',
  principal_name: 'Drs. Nama Kepala Sekolah, M.Pd.',
  principal_nip: '19700101 199501 1 001',
  
  // Student
  logo_left: DEFAULT_ASSET_L,
  logo_right: DEFAULT_LOGO_KEMENDIKBUD,
  signature_image: DEFAULT_SIG,
  stamp_image: DEFAULT_STAMP,
  terms_student: '1. Kartu wajib dibawa setiap hari.\n2. Dilarang dipinjamkan.\n3. Jika hilang segera lapor ke sekolah.\n4. Berlaku selama siswa aktif.\n5. Kartu dipakai untuk scan layanan/absen.',
  student_show_logo_front: true,
  student_show_logo_back: true,
  student_show_logo_right_front: true,
  student_show_logo_right_back: false,
  student_show_sig_front: false,
  student_show_sig_back: true,
  student_show_stamp_front: false,
  student_show_stamp_back: true,
  student_show_photo_front: true,
  student_show_photo_back: false,
  student_show_info_front: true,
  student_show_info_back: false,
  student_show_qr_front: false,
  student_show_qr_back: true,
  student_show_valid_front: true,
  student_show_valid_back: false,

  // Exam
  logo_left_exam: DEFAULT_ASSET_L,
  logo_right_exam: DEFAULT_LOGO_KEMENDIKBUD,
  signature_exam: DEFAULT_SIG,
  stamp_exam: DEFAULT_STAMP,
  terms_exam: '1. Kartu wajib dibawa setiap sesi ujian.\n2. Hadir 15 menit sebelum ujian dimulai.\n3. Dilarang membawa alat komunikasi/HP.\n4. Menjaga ketertiban di dalam ruang ujian.',
  exam_show_logo_front: true,
  exam_show_logo_back: true,
  exam_show_logo_right_front: true,
  exam_show_logo_right_back: false,
  exam_show_sig_front: false,
  exam_show_sig_back: true,
  exam_show_stamp_front: false,
  exam_show_stamp_back: true,
  exam_show_photo_front: true,
  exam_show_photo_back: false,
  exam_show_info_front: true,
  exam_show_info_back: false,
  exam_show_qr_front: false,
  exam_show_qr_back: true,
  exam_show_valid_front: true,
  exam_show_valid_back: false,

  // ID Card
  logo_left_id: DEFAULT_ASSET_L,
  logo_right_id: '',
  signature_id: DEFAULT_SIG,
  stamp_id: DEFAULT_STAMP,
  terms_id: '1. Kartu identitas resmi SMKN 2 Tana Toraja.\n2. Wajib dikenakan selama jam dinas/operasional.\n3. Penyalahgunaan kartu akan dikenakan sanksi.\n4. Temukan kartu? Hubungi admin sekolah.',
  id_show_logo_front: true,
  id_show_logo_back: true,
  id_show_logo_right_front: false,
  id_show_logo_right_back: false,
  id_show_sig_front: false,
  id_show_sig_back: true,
  id_show_stamp_front: false,
  id_show_stamp_back: true,
  id_show_photo_front: true,
  id_show_photo_back: false,
  id_show_info_front: true,
  id_show_info_back: false,
  id_show_qr_front: false,
  id_show_qr_back: true,
  id_show_valid_front: true,
  id_show_valid_back: false,
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
    }
  ],
  school_settings: DEFAULT_SETTINGS,
  sessions: [
    { id: 's1', name: 'Masuk', start_time: '07:00', late_after: '07:30' },
    { id: 's2', name: 'Pulang', start_time: '15:00' }
  ],
  logs: [],
  exams: [
    { id: 'e1', name: 'PAS Ganjil', school_year: '2024/2025', semester: 'Ganjil', start_date: '2024-12-01', end_date: '2024-12-15' }
  ],
  templates: [
    { id: 't1', type: 'STUDENT_CARD', name: 'Modern Blue Style', config_json: '{"front":{"headerBg":"#2E50B8","bodyBg":"#ffffff","footerBg":"#4FBFDD","textColor":"#334155","bgImage":"","fontFamily":"Inter, sans-serif"},"back":{"headerBg":"#2E50B8","bodyBg":"#ffffff","footerBg":"#4FBFDD","textColor":"#334155","bgImage":"","fontFamily":"Inter, sans-serif"}}', is_active: true, preview_color: 'bg-blue-600' },
    { id: 't2', type: 'EXAM_CARD', name: 'Professional Exam Card', config_json: '{"front":{"headerBg":"#1e293b","bodyBg":"#ffffff","footerBg":"#f97316","textColor":"#ffffff","bgImage":"","fontFamily":"Inter, sans-serif"},"back":{"headerBg":"#1e293b","bodyBg":"#ffffff","footerBg":"#f97316","textColor":"#ffffff","bgImage":"","fontFamily":"Inter, sans-serif"}}', is_active: true, preview_color: 'bg-orange-500' },
    { id: 't3', type: 'ID_CARD', name: 'Modern Green Batik', config_json: '{"front":{"headerBg":"#1B3C33","bodyBg":"#ffffff","footerBg":"#10B981","textColor":"#ffffff","bgImage":"","fontFamily":"Inter, sans-serif"},"back":{"headerBg":"#1B3C33","bodyBg":"#f8fafc","footerBg":"#10B981","textColor":"#ffffff","bgImage":"","fontFamily":"Inter, sans-serif"}}', is_active: true, preview_color: 'bg-emerald-800' }
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
    const parsed = JSON.parse(stored);
    return parsed;
  } catch (e) {
    return INITIAL_DB;
  }
}

export function saveDB(db: DB) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
