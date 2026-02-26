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
    front: { headerBg: '#1B3C33', bodyBg: '#ffffff', footerBg: '#10B981', textColor: '#ffffff', bgImage: '', fontFamily: 'Inter, sans-serif' },
    back: { headerBg: '#1B3C33', bodyBg: '#ffffff', footerBg: '#f8fafc', textColor: '#ffffff', bgImage: '', fontFamily: 'Inter, sans-serif' }
  };

  let config = DEFAULT_CONFIG;
  try {
    if (template?.config_json) {
      const parsed = JSON.parse(template.config_json);
      config = {
        front: { ...DEFAULT_CONFIG.front, ...parsed.front },
        back: { ...DEFAULT_CONFIG.back, ...parsed.back }
      };
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
    color: side === 'front' ? '#ffffff' : '#334155',
    fontFamily: current.fontFamily
  };

  const showLogo = side === 'front' ? settings.id_show_logo_front : settings.id_show_logo_back;
  const showSig = side === 'front' ? settings.id_show_sig_front : settings.id_show_sig_back;
  const showStamp = side === 'front' ? settings.id_show_stamp_front : settings.id_show_stamp_back;

  if (side === 'front') {
    return (
      <div style={cardStyle} className="relative rounded-2xl shadow-2xl border overflow-hidden select-none flex flex-col">
        <div style={{ backgroundColor: current.headerBg }} className="relative z-20 pt-10 pb-6 px-6 flex flex-col items-center shadow-lg">
          <div className="flex items-center gap-4 w-full text-white">
            {showLogo && settings.logo_left_id && (
              <div className="w-12 h-12 relative bg-white rounded-xl p-2 shadow-inner">
                <Image src={settings.logo_left_id} alt="Logo" fill className="object-contain" priority unoptimized />
              </div>
            )}
            <div className="flex flex-col">
              <h2 className="font-black text-[11px] uppercase leading-none tracking-tight drop-shadow-sm">{settings.school_name}</h2>
              <h2 className="font-bold text-[8px] uppercase opacity-70 mt-1">Digital Identity</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-8">
          <div className="w-full aspect-[3/4] rounded-2xl border-4 border-white shadow-2xl relative overflow-hidden bg-slate-100">
            {student.photo_url ? (
              <Image src={student.photo_url} alt={student.name} fill className="object-cover object-top" priority unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300 uppercase font-bold">FOTO</div>
            )}
          </div>
          
          <div className="w-full mt-6 space-y-1 text-center">
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none text-slate-800">
              {student.name}
            </h1>
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-sm" style={{ backgroundColor: current.headerBg }}>
              {student.major}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: current.headerBg }} className="relative z-20 p-6 pt-4 space-y-3 border-t border-white/10 text-white">
          <div className="grid grid-cols-2 gap-4 text-[9px] font-bold">
            <div className="flex flex-col">
              <span className="opacity-60 uppercase text-[6px] tracking-widest mb-1">NIS / NISN</span>
              <span>{student.nis} / {student.nisn || '-'}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="opacity-60 uppercase text-[6px] tracking-widest mb-1">Berlaku</span>
              <span>{student.valid_until}</span>
            </div>
          </div>

          {(showSig || showStamp) && (
            <div className="flex justify-between items-end pt-2 border-t border-white/10">
              <div className="w-12 h-12 relative">
                {showStamp && settings.stamp_id && <Image src={settings.stamp_id} alt="Stamp" fill className="object-contain" unoptimized />}
              </div>
              <div className="text-right">
                {showSig && settings.signature_id && (
                  <div className="w-16 h-8 relative ml-auto">
                    <Image src={settings.signature_id} alt="Sig" fill className="object-contain" unoptimized />
                  </div>
                )}
                <p className="text-[7px] font-bold uppercase opacity-80">{settings.principal_name}</p>
                <p className="text-[5px] opacity-60">NIP: {settings.principal_nip}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle} className="relative rounded-2xl shadow-2xl border overflow-hidden select-none flex flex-col p-8">
      <div className="relative z-10 flex flex-col items-center h-full text-center">
        {showLogo && settings.logo_left_id && (
          <div className="w-14 h-14 relative mb-4">
             <Image src={settings.logo_left_id} alt="Logo" fill className="object-contain" unoptimized />
          </div>
        )}
        <h3 className="font-black text-[12px] uppercase tracking-tight mb-8 text-slate-800">
          {settings.school_name}
        </h3>

        <div className="bg-white p-4 rounded-2xl shadow-2xl mb-10 border-4 border-slate-50">
           <div className="relative w-36 h-36">
             <Image 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VERIFY-${student.card_code}`}
               alt="QR" fill className="object-contain" unoptimized
             />
           </div>
        </div>

        <div className="flex-1 w-full space-y-4">
           <h4 className="text-[10px] font-black uppercase tracking-widest border-b pb-2 text-slate-700">
             Ketentuan Pengguna
           </h4>
           <div className="space-y-3 text-[9px] opacity-80 leading-relaxed italic text-slate-700 text-left whitespace-pre-line">
              {settings.terms_id}
           </div>
        </div>

        <div className="w-full pt-6 flex justify-between items-end">
            <div className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">
              ED-SYNC v2.5
            </div>
            {(showSig || showStamp) && (
              <div className="text-center relative">
                 {showStamp && settings.stamp_id && (
                    <div className="absolute -left-12 top-0 w-20 h-10 pointer-events-none">
                       <Image src={settings.stamp_id} alt="Stamp" fill className="object-contain" unoptimized />
                    </div>
                 )}
                 {showSig && settings.signature_id && (
                   <div className="w-20 h-10 relative mb-1">
                      <Image src={settings.signature_id} alt="Sig" fill className="object-contain" unoptimized />
                   </div>
                 )}
                 <p className="text-[8px] font-bold uppercase text-slate-800">{settings.principal_name}</p>
                 <p className="text-[5px] opacity-60">NIP: {settings.principal_nip}</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
