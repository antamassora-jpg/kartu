
"use client";

import { Student, SchoolSettings, CardTemplate } from '@/app/lib/types';
import Image from 'next/image';

export function IdCardVisual({ 
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
    front: { headerBg: '#1B3C33', bodyBg: '#ffffff', footerBg: '#10B981', textColor: '#ffffff', bgImage: '' },
    back: { headerBg: '#1B3C33', bodyBg: '#ffffff', footerBg: '#f8fafc', textColor: '#ffffff', bgImage: '' }
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
    width: '276px',
    height: '420px',
    backgroundColor: current.bodyBg,
    backgroundImage: current.bgImage ? `url(${current.bgImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: current.textColor
  };

  if (side === 'front') {
    return (
      <div style={cardStyle} className="relative rounded-2xl shadow-2xl border overflow-hidden select-none font-sans flex flex-col">
        {/* Header */}
        <div style={{ backgroundColor: current.headerBg }} className="relative z-20 pt-10 pb-4 px-6 flex flex-col items-center shadow-md">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 relative bg-white/20 rounded-lg p-1.5 backdrop-blur-sm border border-white/20">
              <Image src={settings.logo_left} alt="Logo" fill className="object-contain" priority />
            </div>
            <div className="flex flex-col">
              <h2 className="font-black text-[10px] uppercase leading-none tracking-tight" style={{ color: current.textColor }}>{settings.school_name}</h2>
              <h2 className="font-bold text-[8px] uppercase opacity-70" style={{ color: current.textColor }}>Identity Card</h2>
            </div>
          </div>
        </div>

        {/* Photo Section */}
        <div className="flex-1 relative z-10 flex items-center justify-center p-6">
          <div className="w-full aspect-[3/4] rounded-2xl border-4 border-white shadow-2xl relative overflow-hidden bg-muted">
            {student.photo_url ? (
              <Image src={student.photo_url} alt={student.name} fill className="object-cover object-top" priority />
            ) : (
              <div className="flex items-center justify-center h-full text-[8px] opacity-20 uppercase font-bold">FOTO</div>
            )}
          </div>
        </div>

        {/* Footer Details */}
        <div style={{ backgroundColor: current.footerBg }} className="relative z-20 p-6 pt-4 space-y-2 border-t border-white/10">
          <div className="space-y-0.5 text-center">
            <h1 className="text-xl font-black uppercase tracking-tight leading-none drop-shadow-md" style={{ color: current.textColor }}>{student.name}</h1>
            <div className="text-[10px] font-bold opacity-80" style={{ color: current.textColor }}>{student.major}</div>
          </div>
          <div className="flex items-center justify-center gap-4 text-[8px] opacity-60" style={{ color: current.textColor }}>
            <div>NIS: {student.nis}</div>
            <div>•</div>
            <div>EXP: {student.valid_until}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle} className="relative rounded-2xl shadow-2xl border overflow-hidden select-none font-sans flex flex-col p-8">
      <div style={{ backgroundColor: current.headerBg }} className="absolute inset-x-0 top-0 h-16 opacity-10"></div>
      
      <div className="relative z-10 flex flex-col items-center h-full text-center">
        <div className="w-12 h-12 relative mb-2">
           <Image src={settings.logo_left} alt="Logo" fill className="object-contain" />
        </div>
        <h3 className="font-black text-[10px] uppercase tracking-tight mb-8" style={{ color: current.textColor }}>
          {settings.school_name}
        </h3>

        <div className="bg-white p-3 rounded-2xl shadow-xl mb-8 border">
           <div className="relative w-32 h-32">
             <Image 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VERIFY-${student.card_code}`}
               alt="QR" fill className="object-contain" unoptimized
             />
           </div>
        </div>

        <div className="flex-1 w-full space-y-4">
           <h4 className="text-[9px] font-black uppercase tracking-widest border-b pb-2" style={{ color: current.textColor, borderColor: `${current.textColor}20` }}>
             Ketentuan Kartu
           </h4>
           <div className="space-y-3 text-[8px] opacity-70 leading-relaxed italic" style={{ color: current.textColor }}>
              <p>1. Kartu ini milik sah {settings.school_name}.</p>
              <p>2. Wajib dibawa saat berada di lingkungan sekolah.</p>
              <p>3. Jika hilang, harap lapor ke bagian Tata Usaha.</p>
           </div>
        </div>

        <div style={{ backgroundColor: current.footerBg }} className="absolute inset-x-0 bottom-0 h-2"></div>
      </div>
    </div>
  );
}
