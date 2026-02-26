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
    front: { headerBg: '#2E50B8', bodyBg: '#ffffff', footerBg: '#4FBFDD', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif' },
    back: { headerBg: '#2E50B8', bodyBg: '#ffffff', footerBg: '#4FBFDD', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif' }
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
    width: '340px',
    height: '215px',
    backgroundColor: current.bodyBg,
    backgroundImage: current.bgImage ? `url(${current.bgImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: current.textColor,
    fontFamily: current.fontFamily
  };

  const showLogoLeft = side === 'front' ? settings.student_show_logo_front : settings.student_show_logo_back;
  const showLogoRight = side === 'front' ? settings.student_show_logo_right_front : settings.student_show_logo_right_back;
  const showSig = side === 'front' ? settings.student_show_sig_front : settings.student_show_sig_back;
  const showStamp = side === 'front' ? settings.student_show_stamp_front : settings.student_show_stamp_back;

  if (side === 'front') {
    return (
      <div style={cardStyle} className="relative rounded-xl shadow-lg border overflow-hidden text-[10px] select-none">
        <div style={{ backgroundColor: current.headerBg }} className="h-14 flex items-center px-4 gap-3 relative z-10 shadow-sm border-b">
          {showLogoLeft && (
            <div className="w-10 h-10 relative bg-white rounded-md p-1 shadow-inner shrink-0">
              <Image src={settings.logo_left} alt="Logo" fill className="object-contain" priority />
            </div>
          )}
          <div className="flex-1 flex flex-col text-white text-center">
            <span className="font-bold text-[10px] uppercase leading-tight tracking-tight drop-shadow-sm">{settings.school_name}</span>
            <span className="text-[6.5px] opacity-90 line-clamp-2 leading-tight">{settings.address}</span>
          </div>
          {showLogoRight && settings.logo_right && (
            <div className="w-10 h-10 relative bg-white rounded-md p-1 shadow-inner shrink-0">
              <Image src={settings.logo_right} alt="Logo R" fill className="object-contain" priority />
            </div>
          )}
        </div>

        <div className="flex h-[calc(100%-56px)] relative z-10">
          <div className="w-[110px] flex flex-col items-center justify-center p-3 gap-2 border-r border-dashed border-muted/50">
            <div className="w-[80px] h-[100px] bg-muted relative rounded-md overflow-hidden border-2 border-white shadow-md">
              {student.photo_url ? (
                <Image src={student.photo_url} alt={student.name} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[8px] text-slate-400">FOTO</div>
              )}
            </div>
          </div>

          <div className="flex-1 py-3 px-4 flex flex-col justify-center gap-3 relative">
            <div className="space-y-2 text-slate-700">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[6px] uppercase font-bold tracking-wider">Nama Lengkap</span>
                <span className="font-extrabold text-[11px] uppercase leading-tight">{student.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[6px] uppercase font-bold tracking-wider">NIS / NISN</span>
                <span className="font-bold text-[9px]">{student.nis} / {student.nisn || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[6px] uppercase font-bold tracking-wider">Program Keahlian</span>
                <span className="font-bold text-[9px] uppercase">{student.major}</span>
              </div>
            </div>

            {(showSig || showStamp) && (
              <div className="absolute bottom-2 right-4 flex items-end gap-2 scale-75 origin-bottom-right">
                {showStamp && (
                  <div className="w-12 h-12 relative">
                    <Image src={settings.stamp_image} alt="Stempel" fill className="object-contain" />
                  </div>
                )}
                {showSig && (
                  <div className="text-center">
                    <div className="w-14 h-7 relative">
                      <Image src={settings.signature_image} alt="TTD" fill className="object-contain" />
                    </div>
                    <p className="text-[6px] font-bold border-t border-slate-300">{settings.principal_name}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: current.footerBg }} className="absolute bottom-0 left-0 right-0 h-1.5"></div>
      </div>
    );
  }

  return (
    <div style={cardStyle} className="relative rounded-xl shadow-lg border overflow-hidden text-[10px] select-none p-6 flex flex-col">
      <div className="flex justify-between items-start mb-3 relative z-10 border-b-2 pb-1" style={{ borderColor: current.headerBg }}>
        {showLogoLeft && (
          <div className="w-8 h-8 relative shrink-0 mr-2">
            <Image src={settings.logo_left} alt="Logo" fill className="object-contain" />
          </div>
        )}
        <h4 className="font-bold text-[11px] uppercase tracking-widest flex-1 text-center" style={{ color: current.headerBg }}>Ketentuan Pengguna</h4>
        {showLogoRight && settings.logo_right && (
          <div className="w-8 h-8 relative shrink-0 ml-2">
            <Image src={settings.logo_right} alt="Logo R" fill className="object-contain" />
          </div>
        )}
      </div>
      
      <div className="flex gap-4 flex-1 items-start relative z-10">
        <div className="flex-1 whitespace-pre-line text-slate-700 italic text-[7.5px] leading-relaxed">
          {settings.terms_student}
        </div>
        <div className="w-16 flex flex-col items-center gap-2">
           <div className="w-14 h-14 bg-white p-1 rounded border shadow-sm relative">
             <Image 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VERIFY-${student.card_code}`}
               alt="QR" fill className="object-contain" unoptimized
             />
           </div>
           <div className="text-[6px] font-bold text-center text-slate-400">{student.card_code}</div>
        </div>
      </div>

      {(showSig || showStamp) && (
        <div className="mt-2 flex justify-end items-end relative z-10">
           <div className="text-center space-y-1 relative">
              <p className="text-[6px] font-bold text-slate-500 uppercase">Kepala Sekolah,</p>
              {showStamp && (
                <div className="absolute -left-6 top-2 w-12 h-12 pointer-events-none opacity-80">
                  <Image src={settings.stamp_image} alt="STAMP" fill className="object-contain" />
                </div>
              )}
              {showSig && (
                <div className="w-16 h-8 relative mx-auto">
                   <Image src={settings.signature_image} alt="TTD" fill className="object-contain" />
                </div>
              )}
              <p className="text-[7px] font-bold border-t pt-0.5" style={{ color: current.headerBg }}>{settings.principal_name}</p>
           </div>
        </div>
      )}
      <div style={{ backgroundColor: current.footerBg }} className="absolute bottom-0 left-0 right-0 h-1.5"></div>
    </div>
  );
}
