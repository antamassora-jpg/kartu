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
  
  const showPhoto = side === 'front' ? settings.student_show_photo_front : settings.student_show_photo_back;
  const showInfo = side === 'front' ? settings.student_show_info_front : settings.student_show_info_back;
  const showQr = side === 'front' ? settings.student_show_qr_front : settings.student_show_qr_back;
  const showValid = side === 'front' ? settings.student_show_valid_front : settings.student_show_valid_back;

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
          {/* SISI KIRI: Foto & Barcode (Stack Vertikal) */}
          {(showPhoto || showQr) && (
            <div className="w-[100px] flex flex-col items-center justify-center p-2 border-r border-dashed border-muted/50 gap-2">
              {showPhoto && (
                <div className="w-[75px] h-[95px] bg-muted relative rounded-md overflow-hidden border-2 border-white shadow-md shrink-0">
                  {student.photo_url ? (
                    <Image src={student.photo_url} alt={student.name} fill className="object-cover" priority unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[8px] text-slate-400 uppercase">FOTO</div>
                  )}
                </div>
              )}
              {showQr && (
                <div className="w-[55px] h-[55px] bg-white p-1 rounded border shadow-sm relative shrink-0">
                  <Image 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFY-${student.card_code}`}
                    alt="QR" fill className="object-contain" unoptimized
                  />
                </div>
              )}
            </div>
          )}

          <div className={`flex-1 py-3 px-4 flex flex-col justify-center relative ${(!showPhoto && !showQr) ? 'items-center text-center' : ''}`}>
            <div style={{ color: current.textColor }}>
              {showInfo && (
                <>
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
                </>
              )}
              {showValid && (
                <div className="mb-1">
                  <span className="opacity-60 text-[6px] uppercase font-bold tracking-wider block mb-0.5">Berlaku Sampai</span>
                  <span className="font-bold text-[8px] block leading-none" style={{ color: current.headerBg }}>{student.valid_until}</span>
                </div>
              )}
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
      <div className="h-14 w-full flex items-center justify-center px-10 gap-4">
        <div className="flex-1 h-[2px]" style={{ backgroundColor: current.headerBg }}></div>
        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: current.headerBg }}>
          Ketentuan Pengguna
        </h4>
        <div className="flex-1 h-[2px]" style={{ backgroundColor: current.headerBg }}></div>
      </div>
      
      <div className="flex-1 px-6 pt-2 flex items-start gap-4">
        {/* Foto di Kiri (Jika diaktifkan di belakang) */}
        {showPhoto && (
          <div className="w-[70px] h-[90px] relative rounded border overflow-hidden shadow-sm shrink-0 bg-slate-50">
             <Image src={student.photo_url || ''} alt="Foto" fill className="object-cover" unoptimized />
          </div>
        )}

        <div className="flex-1 whitespace-pre-line text-slate-700 italic text-[7.5px] leading-relaxed">
          {settings.terms_student}
          {showInfo && (
            <div className="mt-2 pt-2 border-t border-slate-200">
               <p className="not-italic font-bold text-[8px] text-slate-800 uppercase">{student.name}</p>
               <p className="not-italic text-[7px] text-slate-500 uppercase">{student.nis} • {student.class}</p>
            </div>
          )}
        </div>

        {/* Barcode di Kanan (Jika diaktifkan di belakang) */}
        {showQr && (
          <div className="w-[60px] flex flex-col items-center gap-1 shrink-0">
             <div className="w-[55px] h-[55px] bg-white p-1 rounded border shadow-sm relative">
               <Image 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFY-${student.card_code}`}
                 alt="QR" fill className="object-contain" unoptimized
               />
             </div>
             <div className="text-[6px] font-black text-center text-slate-400 uppercase tracking-widest">{student.card_code}</div>
          </div>
        )}
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
