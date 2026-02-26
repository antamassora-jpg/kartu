
"use client";

import { Student, SchoolSettings, ExamEvent, CardTemplate } from '@/app/lib/types';
import Image from 'next/image';

export function ExamCardVisual({ 
  student, 
  settings, 
  exam,
  side = 'front',
  template
}: { 
  student: Student, 
  settings: SchoolSettings, 
  exam?: ExamEvent,
  side?: 'front' | 'back',
  template?: CardTemplate | null
}) {
  const DEFAULT_CONFIG = {
    front: { headerBg: '#1e293b', bodyBg: '#ffffff', footerBg: '#f97316', textColor: '#ffffff', bgImage: '' },
    back: { headerBg: '#1e293b', bodyBg: '#ffffff', footerBg: '#f97316', textColor: '#ffffff', bgImage: '' }
  };

  let config = DEFAULT_CONFIG;
  try {
    if (template?.config_json) {
      const parsed = JSON.parse(template.config_json);
      if (parsed.front) config = parsed;
    }
  } catch (e) {}

  const current = side === 'front' ? config.front : config.back;

  const cardStyle = {
    width: '340px',
    height: '215px',
    backgroundColor: current.bodyBg,
    backgroundImage: current.bgImage ? `url(${current.bgImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: current.textColor
  };

  if (side === 'front') {
    return (
      <div style={cardStyle} className="relative rounded-xl shadow-lg border overflow-hidden text-[10px] select-none font-sans">
        <div style={{ backgroundColor: current.headerBg }} className="h-14 flex items-center px-4 gap-3 relative z-10 shadow-sm border-b-2 border-orange-500">
          <div className="w-10 h-10 relative bg-white rounded-md p-1">
            <Image src={settings.logo_left} alt="Logo" fill className="object-contain" priority />
          </div>
          <div className="flex-1 flex flex-col text-white">
            <span className="font-bold text-[9px] uppercase leading-tight tracking-tight">{settings.school_name}</span>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: current.footerBg }}>KARTU PESERTA UJIAN</span>
          </div>
        </div>

        <div className="flex h-[calc(100%-56px)] relative z-10">
          <div className="w-[100px] flex flex-col items-center justify-center p-2 gap-2 border-r border-slate-100">
            <div className="w-[75px] h-[95px] bg-slate-50 relative rounded-md overflow-hidden border border-slate-200">
              {student.photo_url && <Image src={student.photo_url} alt={student.name} fill className="object-cover" priority />}
            </div>
          </div>
          <div className="flex-1 py-4 px-3 space-y-2 text-slate-900">
            <div className="flex flex-col">
              <span className="text-slate-400 text-[6px] uppercase font-bold">Nama Peserta</span>
              <span className="font-bold text-[11px] uppercase">{student.name}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-[6px] uppercase font-bold">NIS</span>
              <span className="font-bold text-[9px]">{student.nis}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-[6px] uppercase font-bold">Mata Pelajaran</span>
              <span className="font-bold text-[8px] uppercase">{student.major}</span>
            </div>
          </div>
        </div>
        <div style={{ backgroundColor: current.footerBg }} className="absolute bottom-0 left-0 right-0 h-1"></div>
      </div>
    );
  }

  return (
    <div style={cardStyle} className="relative rounded-xl shadow-lg border overflow-hidden text-[9px] select-none font-sans p-6 flex flex-col">
      <div className="text-center mb-3">
        <h4 className="font-black text-[10px] uppercase border-b pb-1 text-slate-800">Tata Tertib Ujian</h4>
      </div>
      <div className="flex-1 space-y-1 text-slate-600 leading-tight">
        <p>1. Membawa kartu ini setiap sesi ujian.</p>
        <p>2. Hadir tepat waktu sesuai jadwal.</p>
        <p>3. Dilarang membawa alat komunikasi.</p>
      </div>
      <div style={{ backgroundColor: current.footerBg }} className="absolute bottom-0 left-0 right-0 h-1"></div>
    </div>
  );
}
