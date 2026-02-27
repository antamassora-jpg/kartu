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
    fontFamily: current.fontFamily,
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const showLogo = side === 'front' ? settings.id_show_logo_front : settings.id_show_logo_back;
  const showLogoRight = side === 'front' ? settings.id_show_logo_right_front : settings.id_show_logo_right_back;
  const showSig = side === 'front' ? settings.id_show_sig_front : settings.id_show_sig_back;
  const showStamp = side === 'front' ? settings.id_show_stamp_front : settings.id_show_stamp_back;
  
  const showPhoto = side === 'front' ? settings.id_show_photo_front : settings.id_show_photo_back;
  const showInfo = side === 'front' ? settings.id_show_info_front : settings.id_show_info_back;
  const showQr = side === 'front' ? settings.id_show_qr_front : settings.id_show_qr_back;
  const showValid = side === 'front' ? settings.id_show_valid_front : settings.id_show_valid_back;

  if (side === 'front') {
    return (
      <div style={cardStyle} className="rounded-2xl shadow-2xl border select-none flex flex-col">
        <div style={{ backgroundColor: current.headerBg }} className="relative z-20 pt-10 pb-6 px-6 flex flex-col items-center shadow-lg border-b border-white/10">
          <div className="flex items-center w-full text-white">
            {showLogo && settings.logo_left_id && (
              <div className="w-12 h-12 relative bg-white rounded-xl p-2 shrink-0 mr-4 shadow-inner">
                <Image src={settings.logo_left_id} alt="Logo" fill className="object-contain" priority unoptimized />
              </div>
            )}
            <div className="flex-1 flex flex-col">
              <h2 className="font-black text-[11px] uppercase leading-tight tracking-tight">{settings.school_name}</h2>
              <h2 className="font-bold text-[8px] uppercase opacity-70 mt-1 block">Digital Identity</h2>
            </div>
            {showLogoRight && settings.logo_right_id && (
              <div className="w-12 h-12 relative bg-white rounded-xl p-2 shrink-0 ml-4 shadow-inner">
                <Image src={settings.logo_right_id} alt="Logo R" fill className="object-contain" priority unoptimized />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-8">
          {showPhoto && (
            <div className="w-full aspect-[3/4] rounded-2xl border-4 border-white shadow-2xl relative overflow-hidden bg-slate-100 mb-4">
              {student.photo_url ? (
                <Image src={student.photo_url} alt={student.name} fill className="object-cover object-top" priority unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300 uppercase font-bold">FOTO</div>
              )}
            </div>
          )}
          
          <div className="w-full text-center">
            {showQr && (
              <div className="mb-4 w-16 h-16 bg-white p-1 rounded border shadow-sm relative mx-auto">
                <Image 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFY-${student.card_code}`}
                  alt="QR" fill className="object-contain" unoptimized
                />
              </div>
            )}
            {showInfo && (
              <>
                <h1 className="text-2xl font-black uppercase tracking-tight leading-none text-slate-800 mb-2">
                  {student.name}
                </h1>
                <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-sm" style={{ backgroundColor: current.headerBg }}>
                  {student.major}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: current.headerBg }} className="relative z-20 p-6 pt-4 text-white border-t border-white/10">
          <div className="flex justify-between text-[9px] font-bold mb-3">
            <div className="flex flex-col">
              {showInfo && (
                <>
                  <span className="opacity-60 uppercase text-[6px] tracking-widest mb-0.5 block">NIS / NISN</span>
                  <span className="block">{student.nis} / {student.nisn || '-'}</span>
                </>
              )}
            </div>
            <div className="flex flex-col text-right">
              {showValid && (
                <>
                  <span className="opacity-60 uppercase text-[6px] tracking-widest mb-0.5 block">Berlaku</span>
                  <span className="block">{student.valid_until}</span>
                </>
              )}
            </div>
          </div>

          {(showSig || showStamp) && (
            <div className="flex justify-between items-end pt-3 border-t border-white/10">
              <div className="w-12 h-12 relative">
                {showStamp && settings.stamp_id && <Image src={settings.stamp_id} alt="Stamp" fill className="object-contain" unoptimized />}
              </div>
              <div className="text-right">
                {showSig && settings.signature_id && (
                  <div className="w-16 h-8 relative mb-1">
                    <Image src={settings.signature_id} alt="Sig" fill className="object-contain" unoptimized />
                  </div>
                )}
                <p className="text-[7px] font-bold uppercase opacity-80 leading-none">{settings.principal_name}</p>
                <p className="text-[5px] opacity-60 mt-0.5">NIP: {settings.principal_nip}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle} className="rounded-2xl shadow-2xl border select-none flex flex-col p-8">
      <div className="relative z-10 flex flex-col items-center text-center mb-6">
        <div className="flex items-center gap-4">
          {showLogo && settings.logo_left_id && (
            <div className="w-14 h-14 relative">
               <Image src={settings.logo_left_id} alt="Logo L" fill className="object-contain" unoptimized />
            </div>
          )}
          {showLogoRight && settings.logo_right_id && (
            <div className="w-14 h-14 relative">
               <Image src={settings.logo_right_id} alt="Logo R" fill className="object-contain" unoptimized />
            </div>
          )}
        </div>
        <h3 className="font-black text-[12px] uppercase tracking-tight text-slate-800 mt-3 mb-1">
          {settings.school_name}
        </h3>
      </div>

      <div className="flex-1 w-full relative z-10">
         <div className="h-8 w-full flex items-center justify-center gap-4 mb-3">
           <div className="flex-1 h-[1px] bg-slate-200"></div>
           <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 whitespace-nowrap">
             Ketentuan Pengguna
           </h4>
           <div className="flex-1 h-[1px] bg-slate-200"></div>
         </div>
         <div className="text-[9px] opacity-80 leading-relaxed italic text-slate-700 text-left whitespace-pre-line mb-6">
            {settings.terms_id}
         </div>

         <div className="flex items-center justify-between gap-4 mt-auto">
            {showPhoto && (
              <div className="w-[70px] h-[90px] relative rounded border overflow-hidden shadow-sm bg-slate-50 shrink-0">
                 <Image src={student.photo_url || ''} alt="Foto" fill className="object-cover" unoptimized />
              </div>
            )}
            
            <div className="flex-1">
               {showInfo && (
                 <div className="not-italic">
                    <p className="font-bold text-[10px] text-slate-800">{student.name}</p>
                    <p className="text-[8px] text-slate-500 uppercase">{student.nis} • {student.major}</p>
                 </div>
               )}
            </div>

            {showQr && (
              <div className="w-[65px] flex flex-col items-center gap-1 shrink-0">
                 <div className="w-[60px] h-[60px] bg-white p-1 rounded border shadow-sm relative">
                   <Image 
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VERIFY-${student.card_code}`}
                     alt="QR" fill className="object-contain" unoptimized
                   />
                 </div>
                 <div className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">{student.card_code}</div>
              </div>
            )}
         </div>
      </div>

      <div className="w-full pt-6 flex justify-between items-end relative z-10">
          <div className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">
            {showValid && `Berlaku: ${student.valid_until}`}
          </div>
          {(showSig || showStamp) && (
            <div className="text-center relative">
               <div className="relative h-12 flex items-center justify-center">
                 {showStamp && settings.stamp_id && (
                    <div className="absolute left-[-20px] top-0 w-20 h-10 pointer-events-none opacity-60">
                       <Image src={settings.stamp_id} alt="Stamp" fill className="object-contain" unoptimized />
                    </div>
                 )}
                 {showSig && settings.signature_id && (
                   <div className="w-20 h-10 relative z-10">
                      <Image src={settings.signature_id} alt="Sig" fill className="object-contain" unoptimized />
                   </div>
                 )}
               </div>
               <p className="text-[8px] font-black uppercase text-slate-800 leading-none mt-1">{settings.principal_name}</p>
               <p className="text-[5px] opacity-60 mt-0.5">NIP: {settings.principal_nip}</p>
            </div>
          )}
      </div>
    </div>
  );
}
