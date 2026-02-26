
"use client";

import { Student, SchoolSettings, CardTemplate } from '@/app/lib/types';
import Image from 'next/image';

export function StudentCardVisual({ 
  student, 
  settings, 
  side = 'front',
  template
}: { 
  student: Student, 
  settings: SchoolSettings, 
  side?: 'front' | 'back',
  template?: CardTemplate | null
}) {
  const DEFAULT_CONFIG = {
    front: { headerBg: '#2E50B8', bodyBg: '#ffffff', footerBg: '#4FBFDD', textColor: '#ffffff', bgImage: '' },
    back: { headerBg: '#2E50B8', bodyBg: '#ffffff', footerBg: '#4FBFDD', textColor: '#ffffff', bgImage: '' }
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
        <div style={{ backgroundColor: current.headerBg }} className="h-14 flex items-center px-4 gap-3 relative z-10 shadow-sm">
          <div className="w-10 h-10 relative bg-white rounded-md p-1 shadow-inner">
            <Image src={settings.logo_left} alt="Logo" fill className="object-contain" priority />
          </div>
          <div className="flex-1 flex flex-col text-white">
            <span className="font-bold text-[11px] uppercase leading-tight tracking-tight" style={{ color: current.textColor }}>{settings.school_name}</span>
            <span className="text-[6.5px] opacity-80 line-clamp-2 leading-tight" style={{ color: current.textColor }}>{settings.address}</span>
          </div>
        </div>

        <div className="flex h-[calc(100%-56px)] relative z-10">
          <div className="w-[110px] flex flex-col items-center justify-center p-3 gap-2 border-r border-dashed border-muted/50">
            <div className="w-[85px] h-[105px] bg-muted relative rounded-md overflow-hidden border-2 border-white shadow-md">
              {student.photo_url && <Image src={student.photo_url} alt={student.name} fill className="object-cover" priority />}
            </div>
          </div>

          <div className="flex-1 py-3 px-3 flex flex-col justify-between">
            <div className="space-y-2 text-slate-900">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[6.5px] uppercase font-bold">Nama Lengkap</span>
                <span className="font-bold text-[12px] uppercase leading-tight">{student.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[6.5px] uppercase font-bold">NIS / NISN</span>
                <span className="font-bold text-[9px]">{student.nis} / {student.nisn}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[6.5px] uppercase font-bold">Jurusan</span>
                <span className="font-bold text-[9px] uppercase">{student.major}</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ backgroundColor: current.footerBg }} className="absolute bottom-0 left-0 right-0 h-1"></div>
      </div>
    );
  }

  return (
    <div style={cardStyle} className="relative rounded-xl shadow-lg border overflow-hidden text-[10px] select-none font-sans p-6 flex flex-col">
      <div className="text-center mb-4 relative">
        <h4 className="font-bold text-[11px] uppercase border-b-2 pb-1 tracking-widest" style={{ color: current.headerBg }}>Ketentuan Pengguna</h4>
      </div>
      <div className="flex-1 whitespace-pre-line text-slate-600 italic text-[8.5px] px-2">
        {settings.terms_text}
      </div>
      <div style={{ backgroundColor: current.footerBg }} className="absolute bottom-0 left-0 right-0 h-1"></div>
    </div>
  );
}
