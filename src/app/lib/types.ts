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
  logo_left: string;
  logo_right: string;
  principal_name: string;
  principal_nip?: string;
  signature_image: string;
  stamp_image: string;
  terms_student: string;
  terms_exam: string;
  terms_id: string;
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
  session_id: string;
  scanned_at: string;
  scanned_by_user_id: string;
  is_valid: boolean;
  reason?: string;
  device_info?: string;
  location?: string;
}
