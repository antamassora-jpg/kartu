export type StudentStatus = 'Aktif' | 'Nonaktif' | 'Lulus' | 'Pindah';

export interface Student {
  id: string;
  nis: string;
  nisn?: string;
  name: string;
  class: string;
  major: string;
  school_year: string;
  photo_url?: string;
  status: StudentStatus;
  valid_until: string;
  card_code: string;
}

export interface SchoolSettings {
  school_name: string;
  address: string;
  principal_name: string;
  principal_nip?: string;
  
  // Student Card Assets (Default)
  logo_left: string;
  logo_right: string;
  signature_image: string;
  stamp_image: string;
  terms_student: string;
  // Student Layout Config
  student_show_logo_front: boolean;
  student_show_logo_back: boolean;
  student_show_logo_right_front: boolean;
  student_show_logo_right_back: boolean;
  student_show_sig_front: boolean;
  student_show_sig_back: boolean;
  student_show_stamp_front: boolean;
  student_show_stamp_back: boolean;

  // Exam Card Assets
  logo_left_exam: string;
  logo_right_exam: string;
  signature_exam: string;
  stamp_exam: string;
  terms_exam: string;
  // Exam Layout Config
  exam_show_logo_front: boolean;
  exam_show_logo_back: boolean;
  exam_show_logo_right_front: boolean;
  exam_show_logo_right_back: boolean;
  exam_show_sig_front: boolean;
  exam_show_sig_back: boolean;
  exam_show_stamp_front: boolean;
  exam_show_stamp_back: boolean;

  // ID Card Assets
  logo_left_id: string;
  logo_right_id: string;
  signature_id: string;
  stamp_id: string;
  terms_id: string;
  // ID Layout Config
  id_show_logo_front: boolean;
  id_show_logo_back: boolean;
  id_show_sig_front: boolean;
  id_show_sig_back: boolean;
  id_show_stamp_front: boolean;
  id_show_stamp_back: boolean;
}

export type TemplateType = 'STUDENT_CARD' | 'EXAM_CARD' | 'ID_CARD';

export interface CardTemplate {
  id: string;
  type: TemplateType;
  name: string;
  config_json: string;
  is_active: boolean;
  preview_color: string;
}

export interface ExamEvent {
  id: string;
  name: string;
  school_year: string;
  semester: string;
  start_date: string;
  end_date: string;
  notes?: string;
}

export interface AttendanceSession {
  id: string;
  name: string;
  start_time?: string;
  late_after?: string;
}

export interface AttendanceLog {
  id: string;
  student_id: string;
  card_code: string;
  date: string;
  session_id: string; // 's1', 's2', or 'exam'
  exam_id?: string; // Link to ExamEvent if session_id is 'exam'
  scanned_at: string;
  scanned_by_user_id: string;
  is_valid: boolean;
  reason?: string;
  device_info?: string;
  location?: string;
}
