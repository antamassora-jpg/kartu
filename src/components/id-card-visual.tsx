
"use client";

import { Student, SchoolSettings, CardTemplate } from '@/app/lib/types';
import Image from 'next/image';

const DEFAULT_ELEMENTS = {
  photo: { x: 68, y: 100, w: 140, h: 180 },
  qr: { x: 110, y: 290, w: 56, h: 56 },
  info: { x: 20, y: 355, align: 'center', fontSize: 12, width: 236 },
  sigBlock: { x: 150, y: 380, scale: 0.8 }
};

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
    front: { headerBg: '#1B3C33', bodyBg: '#ffffff', footerBg: '#10B981', textColor: '#ffffff', bgImage: '', fontFamily: 'Inter, sans-serif', elements: { ...DEFAULT_ELEMENTS } },
    back: { headerBg: '#1B3C33', bodyBg: '#ffffff', footerBg: '#f8fafc', textColor: '#ffffff', bgImage: '', fontFamily: 'Inter, sans-serif', elements: { ...DEFAULT_ELEMENTS } }
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
  const els = current.elements || DEFAULT_ELEMENTS;

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

  return (
    <div style={cardStyle} className="rounded-2xl shadow-2xl border select-none">
      {/* Header */}
      <div style={{ backgroundColor: current.headerBg }} className="relative z-20 pt-8 pb-5 px-6 flex flex-col items-center shadow-lg border-b border-white/10">
        <div className="flex items-center w-full text-white">
          {showLogo && settings.logo_left_id && (
            <div className="w-10 h-10 relative bg-white rounded-xl p-1.5 shrink-0 mr-3">
              <Image src={settings.logo_left_id} alt="Logo" fill className="object-contain" priority unoptimized />
            </div>
          )}
          <div className="flex-1 flex flex-col">
            <h2 className="font-black text-[10px] uppercase leading-tight tracking-tight">{settings.school_name}</h2>
            <h2 className="font-bold text-[7px] uppercase opacity-70 mt-0.5 block">Digital Identity Card</h2>
          </div>
          {showLogoRight && settings.logo_right_id && (
            <div className="w-10 h-10 relative bg-white rounded-xl p-1.5 shrink-0 ml-2">
              <Image src={settings.logo_right_id} alt="Logo R" fill className="object-contain" priority unoptimized />
            </div>
          )}
        </div>
      </div>

      {/* Konten Fleksibel */}
      {showPhoto && (
        <div 
          className="absolute rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-slate-100"
          style={{ left: els.photo.x, top: els.photo.y, width: els.photo.w, height: els.photo.h }}
        >
          {student.photo_url ? (
            <Image src={student.photo_url} alt={student.name} fill className="object-cover object-top" priority unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300 uppercase font-bold">FOTO</div>
          )}
        </div>
      )}

      {showQr && (
        <div 
          className="absolute bg-white p-1.5 rounded-xl border shadow-sm"
          style={{ left: els.qr.x, top: els.qr.y, width: els.qr.w, height: els.qr.h }}
        >
          <Image 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFY-${student.card_code}`}
            alt="QR" fill className="object-contain" unoptimized
          />
        </div>
      )}

      {showInfo && (
        <div 
          className="absolute px-4 flex flex-col gap-1"
          style={{ 
            left: els.info.x, 
            top: els.info.y, 
            width: `${els.info.width || 236}px`,
            textAlign: els.info.align || 'center',
            alignItems: els.info.align === 'center' ? 'center' : (els.info.align === 'right' ? 'flex-end' : 'flex-start'),
            color: side === 'front' ? '#1e293b' : current.textColor
          }}
        >
          <h1 className="font-black uppercase tracking-tight leading-none mb-1" style={{ fontSize: (els.info.fontSize || 12) + 2 }}>{student.name}</h1>
          <div className="inline-block px-3 py-1 rounded-full font-bold text-white uppercase tracking-wider shadow-sm" style={{ backgroundColor: current.headerBg, fontSize: (els.info.fontSize || 12) - 3 }}>
            {student.major}
          </div>
          <div className="mt-2 flex flex-col gap-0.5 opacity-70 font-bold uppercase tracking-widest" style={{ fontSize: (els.info.fontSize || 12) - 4 }}>
             <span>{student.nis} / {student.nisn || '-'}</span>
             {showValid && <span>Berlaku: {student.valid_until}</span>}
          </div>
        </div>
      )}

      {(showSig || showStamp) && (
        <div 
          className="absolute flex items-end"
          style={{ 
            left: els.sigBlock.x, 
            top: els.sigBlock.y,
            transform: `scale(${els.sigBlock.scale || 0.8})`,
            transformOrigin: 'top left'
          }}
        >
          {showStamp && settings.stamp_id && (
            <div className="w-12 h-12 relative mr-2">
              <Image src={settings.stamp_id} alt="Stamp" fill className="object-contain" unoptimized />
            </div>
          )}
          <div className="text-left">
            {showSig && settings.signature_id && (
              <div className="w-16 h-8 relative mb-1">
                <Image src={settings.signature_id} alt="Sig" fill className="object-contain" unoptimized />
              </div>
            )}
            <p className="text-[7px] font-bold uppercase opacity-80 leading-none border-t border-slate-300 pt-1">{settings.principal_name}</p>
            <p className="text-[5px] opacity-60">NIP: {settings.principal_nip}</p>
          </div>
        </div>
      )}

      {side === 'back' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[240px] text-center">
           <div className="flex items-center justify-center gap-3 mb-4 relative py-1">
              <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-slate-300 -z-10"></div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-white px-3 relative z-10 border border-slate-100 rounded-full">Ketentuan ID Card</span>
           </div>
           <p className="text-[8px] italic text-slate-500 leading-relaxed whitespace-pre-line text-left px-4">
             {settings.terms_id}
           </p>
        </div>
      )}

      <div style={{ backgroundColor: current.headerBg }} className="absolute bottom-0 left-0 right-0 h-2"></div>
    </div>
  );
}
