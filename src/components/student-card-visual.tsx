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
    fontFamily: current.fontFamily,
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const showLogoLeft = side === 'front' ? settings.student_show_logo_front : settings.student_show_logo_back;
  const showLogoRight = side === 'front' ? settings.student_show_logo_right_front : settings.student_show_logo_right_back;
  const showSig = side === 'front' ? settings.student_show_sig_front : settings.student_show_sig_back;
  const showStamp = side === 'front' ? settings.student_show_stamp_front : settings.student_show_stamp_back;

  if (side === 'front') {
    return (
      <div style={cardStyle} className="rounded-xl shadow-lg border text-[10px] select-none">
        <div style={{ backgroundColor: current.headerBg }} className="h-14 flex items-center px-4 relative z-10 border-b">
          {showLogoLeft && settings.logo_left && (
            <div className="w-10 h-10 relative bg-white rounded-md p-1 shrink-0 mr-3">
              <Image src={settings.logo_left} alt="Logo" fill className="object-contain" priority unoptimized />
            </div>
          )}
          <div className="flex-1 flex flex-col text-white text-center">
            <span className="font-bold text-[10px] uppercase leading-tight tracking-tight">{settings.school_name}</span>
            <span className="text-[6.5px] opacity-90 leading-tight block mt-0.5">{settings.address}</span>
          </div>
          {showLogoRight && settings.logo_right && (
            <div className="w-10 h-10 relative bg-white rounded-md p-1 shrink-0 ml-3">
              <Image src={settings.logo_right} alt="Logo R" fill className="object-contain" priority unoptimized />
            </div>
          )}
        </div>

        <div className="flex h-[calc(100%-56px)] relative z-10">
          <div className="w-[110px] flex flex-col items-center justify-center p-3 border-r border-dashed border-muted/50">
            <div className="w-[80px] h-[100px] bg-muted relative rounded-md overflow-hidden border-2 border-white shadow-md">
              {student.photo_url ? (
                <Image src={student.photo_url} alt={student.name} fill className="object-cover" priority unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[8px] text-slate-400 uppercase">FOTO SISWA</div>
              )}
            </div>
          </div>

          <div className="flex-1 py-3 px-4 flex flex-col justify-center relative">
            <div style={{ color: current.textColor }}>
              <div className="mb-2">
                <span className="opacity-60 text-[6px] uppercase font-bold tracking-wider block mb-0.5">Nama Lengkap</span>
                <span className="font-extrabold text-[11px] uppercase leading-none block">{student.name}</span>
              </div>
              <div className="mb-2">
                <span className="opacity-60 text-[6px] uppercase font-bold tracking-wider block mb-0.5">NIS / NISN</span>
                <span className="font-bold text-[9px] block leading-none">{student.nis} / {student.nisn || '-'}</span>
              </div>
              <div className="mb-2">
                <span className="opacity-60 text-[6px] uppercase font-bold tracking-wider block mb-0.5">Kelas & Jurusan</span>
                <span className="font-bold text-[8px] uppercase block leading-none">{student.class} - {student.major}</span>
              </div>
              <div className="mb-1">
                <span className="opacity-60 text-[6px] uppercase font-bold tracking-wider block mb-0.5">Berlaku Sampai</span>
                <span className="font-bold text-[8px] block leading-none" style={{ color: current.headerBg }}>{student.valid_until}</span>
              </div>
            </div>

            {(showSig || showStamp) && (
              <div className="absolute bottom-2 right-4 flex items-end scale-75 origin-bottom-right">
                {showStamp && settings.stamp_image && (
                  <div className="w-12 h-12 relative mr-2">
                    <Image src={settings.stamp_image} alt="Stempel" fill className="object-contain" unoptimized />
                  </div>
                )}
                {(showSig && settings.signature_image) && (
                  <div className="text-center">
                    <div className="w-14 h-7 relative mb-1">
                      <Image src={settings.signature_image} alt="TTD" fill className="object-contain" unoptimized />
                    </div>
                    <p className="text-[6px] font-bold border-t border-slate-300 leading-none pt-1">{settings.principal_name}</p>
                    <p className="text-[5px] opacity-70 mt-0.5">NIP: {settings.principal_nip}</p>
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
    <div style={cardStyle} className="rounded-xl shadow-lg border text-[10px] select-none p-0 flex flex-col">
      <div className="relative z-10 h-14 w-full flex items-center justify-center px-6">
        <div className="absolute left-6 right-6 h-[2px] z-0" style={{ backgroundColor: current.headerBg }}></div>
        <div className="relative z-10 bg-white px-4 flex items-center gap-3">
          {showLogoLeft && settings.logo_left && (
            <div className="w-6 h-6 relative shrink-0">
              <Image src={settings.logo_left} alt="Logo" fill className="object-contain" unoptimized />
            </div>
          )}
          <h4 className="font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: current.headerBg }}>Ketentuan Pengguna</h4>
          {showLogoRight && settings.logo_right && (
            <div className="w-6 h-6 relative shrink-0">
              <Image src={settings.logo_right} alt="Logo R" fill className="object-contain" unoptimized />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 px-8 pt-2 flex items-start">
        <div className="flex-1 whitespace-pre-line text-slate-700 italic text-[7.5px] leading-relaxed pr-6">
          {settings.terms_student}
        </div>
        <div className="w-20 flex flex-col items-center">
           <div className="w-16 h-16 bg-white p-1 rounded border shadow-sm relative mb-1.5">
             <Image 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFY-${student.card_code}`}
               alt="QR" fill className="object-contain" unoptimized
             />
           </div>
           <div className="text-[6px] font-black text-center text-slate-400 uppercase tracking-widest">{student.card_code}</div>
        </div>
      </div>

      {(showSig || showStamp) && (
        <div className="p-8 pt-0 mt-auto flex justify-end items-end relative z-10">
           <div className="text-center relative">
              <p className="text-[6px] font-bold text-slate-400 uppercase mb-1">Kepala Sekolah,</p>
              <div className="relative h-12 flex items-center justify-center">
                {showStamp && settings.stamp_image && (
                  <div className="absolute left-[-15px] top-0 w-12 h-12 pointer-events-none opacity-80">
                    <Image src={settings.stamp_image} alt="STAMP" fill className="object-contain" unoptimized />
                  </div>
                )}
                {showSig && settings.signature_image && (
                  <div className="w-16 h-8 relative z-10">
                    <Image src={settings.signature_image} alt="TTD" fill className="object-contain" unoptimized />
                  </div>
                )}
              </div>
              <p className="text-[7px] font-black border-t pt-1 leading-none mt-1" style={{ color: current.headerBg, borderColor: '#e2e8f0' }}>{settings.principal_name}</p>
              <p className="text-[5px] opacity-60 mt-0.5">NIP: {settings.principal_nip}</p>
           </div>
        </div>
      )}
      <div style={{ backgroundColor: current.footerBg }} className="absolute bottom-0 left-0 right-0 h-1.5"></div>
    </div>
  );
}
