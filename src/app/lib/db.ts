
/**
 * Bridge file untuk kompatibilitas transisi ke Firebase Firestore.
 * Sebagian besar fungsi CRUD sekarang disarankan menggunakan hooks Firebase langsung di komponen.
 */
import { Student, SchoolSettings, AttendanceSession, AttendanceLog, ExamEvent, CardTemplate } from './types';

// Data statis untuk fallback UI jika Firebase belum siap
export const DEFAULT_SETTINGS: SchoolSettings = {
  school_name: 'SMKN 2 TANA TORAJA',
  address: 'Jl. Poros Makale-Rantepao, Tana Toraja',
  principal_name: 'Drs. Nama Kepala Sekolah, M.Pd.',
  principal_nip: '19700101 199501 1 001',
  logo_left: 'https://iili.io/KAqSZhb.png',
  logo_right: 'https://iili.io/29vR0bV.png',
  signature_image: 'https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=200&h=100&auto=format&fit=crop',
  stamp_image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=200&h=200&auto=format&fit=crop',
  terms_student: '1. Kartu wajib dibawa setiap hari.\n2. Dilarang dipinjamkan.\n3. Jika hilang segera lapor ke sekolah.',
  // Default Booleans
  student_show_logo_front: true, student_show_logo_back: true, student_show_logo_right_front: true,
  student_show_logo_right_back: false, student_show_sig_front: false, student_show_sig_back: true,
  student_show_stamp_front: false, student_show_stamp_back: true, student_show_photo_front: true,
  student_show_photo_back: false, student_show_info_front: true, student_show_info_back: false,
  student_show_qr_front: false, student_show_qr_back: true, student_show_valid_front: true,
  student_show_valid_back: false,
  // Exam
  logo_left_exam: 'https://iili.io/KAqSZhb.png', logo_right_exam: 'https://iili.io/29vR0bV.png',
  signature_exam: '', stamp_exam: '', terms_exam: '',
  exam_show_logo_front: true, exam_show_logo_back: true, exam_show_logo_right_front: true,
  exam_show_logo_right_back: false, exam_show_sig_front: false, exam_show_sig_back: true,
  exam_show_stamp_front: false, exam_show_stamp_back: true, exam_show_photo_front: true,
  exam_show_photo_back: false, exam_show_info_front: true, exam_show_info_back: false,
  exam_show_qr_front: false, exam_show_qr_back: true, exam_show_valid_front: true,
  exam_show_valid_back: false,
  // ID Card
  logo_left_id: 'https://iili.io/KAqSZhb.png', logo_right_id: '', signature_id: '', stamp_id: '', terms_id: '',
  id_show_logo_front: true, id_show_logo_back: true, id_show_logo_right_front: false,
  id_show_logo_right_back: false, id_show_sig_front: false, id_show_sig_back: true,
  id_show_stamp_front: false, id_show_stamp_back: true, id_show_photo_front: true,
  id_show_photo_back: false, id_show_info_front: true, id_show_info_back: false,
  id_show_qr_front: false, id_show_qr_back: true, id_show_valid_front: true,
  id_show_valid_back: false,
};

// Fungsi getDB sekarang hanya mengembalikan data in-memory sebagai fallback.
// Disarankan beralih ke useFirestore() hooks.
export function getDB() {
  if (typeof window === 'undefined') return { students: [], logs: [], exams: [], school_settings: DEFAULT_SETTINGS, templates: [] };
  const stored = localStorage.getItem('educard_sync_db');
  return stored ? JSON.parse(stored) : { students: [], logs: [], exams: [], school_settings: DEFAULT_SETTINGS, templates: [] };
}

export function saveDB(db: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('educard_sync_db', JSON.stringify(db));
}
