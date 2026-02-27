
"use client";

import { Student, SchoolSettings, ExamEvent, CardTemplate } from '@/app/lib/types';
import Image from 'next/image';

const DEFAULT_ELEMENTS = {
  photo: { x: 15, y: 70, w: 60, h: 80 },
  qr: { x: 15, y: 155, w: 48, h: 48 },
  info: { x: 90, y: 70, align: 'left', fontSize: 10, width: 180 },
  sigBlock: { x: 240, y: 160, scale: 0.75 }
};

const DEFAULT_WATERMARK = {
  enabled: false,
  text: 'SMKN 2 TANA TORAJA',
  opacity: 0.1,
  size: 10,
  angle: -30
};

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
    front: { 
      headerBg: '#1e293b', bodyBg: '#ffffff', footerBg: '#f97316', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif', 
      elements: { ...DEFAULT_ELEMENTS },
      watermark: { ...DEFAULT_WATERMARK }
    },
    back: { 
      headerBg: '#1e293b', bodyBg: '#ffffff', footerBg: '#f97316', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif', 
      elements: { ...DEFAULT_ELEMENTS, photo: { ...DEFAULT_ELEMENTS.photo, x: 15 }, info: { ...DEFAULT_ELEMENTS.info, x: 90 }, qr: { ...DEFAULT_ELEMENTS.qr, x: 275 } },
      watermark: { ...DEFAULT_WATERMARK }
    }
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
  const wm = current.watermark || DEFAULT_WATERMARK;

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

  const watermarkSvg = wm.enabled ? `
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150">
      <text 
        x="50%" 
        y="50%" 
        font-family="${current.fontFamily.split(',')[0]}" 
        font-size="${wm.size}px" 
        font-weight="900"
        fill="black" 
        fill-opacity="${wm.opacity}" 
        text-anchor="middle" 
        transform="rotate(${wm.angle}, 75, 75)"
      >
        ${wm.text}
      </text>
    </svg>
  ` : '';

  const watermarkDataUri = wm.enabled ? `url("data:image/svg+xml;base64,${btoa(watermarkSvg)}")` : 'none';

  const showLogoLeft = side === 'front' ? settings.exam_show_logo_front : settings.exam_show_logo_back;
  const showLogoRight = side === 'front' ? settings.exam_show_logo_right_front : settings.exam_show_logo_right_back;
  const showSig = side === 'front' ? settings.exam_show_sig_front : settings.exam_show_sig_back;
  const showStamp = side === 'front' ? settings.exam_show_stamp_front : settings.exam_show_stamp_back;
  const showPhoto = side === 'front' ? settings.exam_show_photo_front : settings.exam_show_photo_back;
  const showInfo = side === 'front' ? settings.exam_show_info_front : settings.exam_show_info_back;
  const showQr = side === 'front' ? settings.exam_show_qr_front : settings.exam_show_qr_back;
  const showValid = side === 'front' ? settings.exam_show_valid_front : settings.exam_show_valid_back;

  return (
    <div style={cardStyle} className="rounded-xl shadow-lg border text-[10px] select-none">
      {wm.enabled && (
        <div 
          className="absolute inset-0 pointer-events-none z-0" 
          style={{ backgroundImage: watermarkDataUri, backgroundRepeat: 'repeat' }}
        ></div>
      )}

      <div style={{ backgroundColor: current.headerBg }} className="h-14 flex items-center px-4 relative z-10 border-b">
        {showLogoLeft && settings.logo_left_exam && (
          <div className="w-10 h-10 relative bg-white rounded-md p-1 shrink-0 mr-3">
            <Image src={settings.logo_left_exam} alt="Logo" fill className="object-contain" priority unoptimized />
          </div>
        )}
        <div className="flex-1 flex flex-col text-white text-center">
          <span className="font-bold text-[9px] uppercase leading-tight tracking-tight">{settings.school_name}</span>
          <span className="text-[10px] font-black uppercase tracking-widest block mt-0.5" style={{ color: current.footerBg }}>KARTU PESERTA UJIAN</span>
        </div>
        {showLogoRight && settings.logo_right_exam && (
          <div className="w-10 h-10 relative bg-white rounded-md p-1 shrink-0 ml-3">
            <Image src={settings.logo_right_exam} alt="Logo R" fill className="object-contain" priority unoptimized />
          </div>
        )}
      </div>

      {showPhoto && (
        <div 
          className="absolute bg-slate-50 rounded-md overflow-hidden border border-slate-200 shadow-sm z-10"
          style={{ left: els.photo.x, top: els.photo.y, width: els.photo.w, height: els.photo.h }}
        >
          {student.photo_url ? (
            <Image src={student.photo_url} alt={student.name} fill className="object-cover" priority unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-[8px]">FOTO</div>
          )}
        </div>
      )}

      {showQr && (
        <div 
          className="absolute bg-white p-1 rounded border shadow-sm z-10"
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
          className="absolute px-2 flex flex-col gap-1.5 z-10"
          style={{ 
            left: els.info.x, 
            top: els.info.y,
            width: `${els.info.width || 180}px`,
            textAlign: els.info.align || 'left',
            alignItems: els.info.align === 'center' ? 'center' : (els.info.align === 'right' ? 'flex-end' : 'flex-start')
          }}
        >
          <div className="w-full">
            <span className="opacity-60 text-[6px] uppercase font-black block">Nama Peserta</span>
            <span className="font-black uppercase leading-tight block" style={{ fontSize: (els.info.fontSize || 10) + 1 }}>{student.name}</span>
          </div>
          <div className="w-full">
            <span className="opacity-60 text-[6px] uppercase font-black block">NIS / NISN</span>
            <span className="font-bold block leading-none" style={{ fontSize: els.info.fontSize || 10 }}>{student.nis} / {student.nisn || '-'}</span>
          </div>
          <div className="w-full">
            <span className="opacity-60 text-[6px] uppercase font-black block">Event Ujian</span>
            <span className="font-bold uppercase block leading-tight" style={{ fontSize: (els.info.fontSize || 10) - 1 }}>{exam?.name || 'UJIAN AKHIR SEKOLAH'}</span>
          </div>
          {showValid && (
            <div className="mt-1 w-full">
              <span className="opacity-60 text-[6px] uppercase font-black block">Masa Berlaku</span>
              <span className="font-black block leading-none" style={{ fontSize: (els.info.fontSize || 10) - 1, color: current.footerBg }}>{student.valid_until}</span>
            </div>
          )}
        </div>
      )}

      {side === 'back' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[280px] text-center z-10">
           <div className="flex items-center justify-center gap-3 mb-3 relative py-1">
              <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-slate-300 -z-10"></div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-white px-3 relative z-10 border border-slate-100 rounded-full">Tata Tertib Ujian</span>
           </div>
           <p className="text-[7.5px] italic text-slate-500 leading-relaxed whitespace-pre-line text-left px-4">
             {settings.terms_exam}
           </p>
        </div>
      )}

      {(showSig || showStamp) && (
        <div 
          className="absolute flex items-end z-10"
          style={{ 
            left: els.sigBlock.x, 
            top: els.sigBlock.y, 
            transform: `scale(${els.sigBlock.scale || 0.75})`,
            transformOrigin: 'top left'
          }}
        >
          {showStamp && settings.stamp_exam && (
            <div className="w-12 h-12 relative mr-2">
              <Image src={settings.stamp_exam} alt="Stamp" fill className="object-contain" unoptimized />
            </div>
          )}
          <div className="text-center">
            {showSig && settings.signature_exam && (
              <div className="w-14 h-7 relative mb-1">
                <Image src={settings.signature_exam} alt="TTD" fill className="object-contain" unoptimized />
              </div>
            )}
            <p className="text-[6px] font-bold border-t border-slate-300 leading-none pt-1">{settings.principal_name}</p>
            <p className="text-[5px] opacity-70 mt-0.5">NIP: {settings.principal_nip}</p>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: current.footerBg }} className="absolute bottom-0 left-0 right-0 h-1.5 z-10"></div>
    </div>
  );
}
