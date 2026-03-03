"use client";

import { Student, SchoolSettings, ExamEvent, CardTemplate } from '@/app/lib/types';
import Image from 'next/image';

const DEFAULT_ELEMENTS = {
  photo: { x: 15, y: 70, w: 60, h: 80 },
  qr: { x: 15, y: 155, w: 48, h: 48 },
  info: { x: 90, y: 70, align: 'left', fontSize: 10, width: 180 },
  signature: { x: 240, y: 150, scale: 0.75 },
  principalInfo: { x: 240, y: 180, fontSize: 6 },
  stamp: { x: 220, y: 160, scale: 0.75 },
  terms: { x: 30, y: 60, width: 280 }
};

const DEFAULT_WATERMARK = {
  enabled: false,
  text: 'SMKN 2 TANA TORAJA',
  opacity: 0.1,
  size: 10,
  angle: -30,
  imageEnabled: false,
  imageUrl: '',
  imageOpacity: 0.1,
  imageSize: 150
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
      elements: { ...DEFAULT_ELEMENTS },
      watermark: { ...DEFAULT_WATERMARK }
    }
  };

  let config = DEFAULT_CONFIG;
  try {
    if (template?.config_json) {
      const parsed = JSON.parse(template.config_json);
      config = {
        front: { ...DEFAULT_CONFIG.front, ...parsed.front, elements: { ...DEFAULT_CONFIG.front.elements, ...parsed.front?.elements }, watermark: { ...DEFAULT_CONFIG.front.watermark, ...parsed.front?.watermark } },
        back: { ...DEFAULT_CONFIG.back, ...parsed.back, elements: { ...DEFAULT_CONFIG.back.elements, ...parsed.back?.elements }, watermark: { ...DEFAULT_CONFIG.back.watermark, ...parsed.back?.watermark } }
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

  const watermarkDataUri = wm.enabled ? `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="25" height="12"><text x="12.5" y="6" font-family="${current.fontFamily}" font-size="${wm.size}px" font-weight="900" fill="black" fill-opacity="${wm.opacity}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${wm.angle}, 12.5, 6)">${wm.text}</text></svg>`)}")` : 'none';

  const showLogoLeft = side === 'front' ? (settings?.exam_show_logo_front ?? true) : (settings?.exam_show_logo_back ?? true);
  const showLogoRight = side === 'front' ? (settings?.exam_show_logo_right_front ?? true) : (settings?.exam_show_logo_right_back ?? false);
  
  // Kontrol legalitas
  const showLegalGroup = side === 'front' ? settings?.exam_show_sig_front : settings?.exam_show_sig_back;
  const showStamp = side === 'front' ? settings?.exam_show_stamp_front : settings?.exam_show_stamp_back;
  
  const showPhoto = side === 'front' ? settings?.exam_show_photo_front : settings?.exam_show_photo_back;
  const showInfo = side === 'front' ? settings?.exam_show_info_front : settings?.exam_show_info_back;
  const showQr = side === 'front' ? settings?.exam_show_qr_front : settings?.exam_show_qr_back;
  const showValid = side === 'front' ? settings?.exam_show_valid_front : settings?.exam_show_valid_back;

  const photoUrl = student.photo_url || (student as any).photoUrl;

  return (
    <div style={cardStyle} className="rounded-xl shadow-lg border text-[10px] select-none">
      {wm.enabled && <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: watermarkDataUri, backgroundRepeat: 'repeat' }}></div>}
      {wm.imageEnabled && wm.imageUrl && <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0" style={{ opacity: wm.imageOpacity }}><div className="relative" style={{ width: wm.imageSize, height: wm.imageSize }}><Image src={wm.imageUrl} alt="W" fill className="object-contain" priority unoptimized /></div></div>}

      <div style={{ backgroundColor: current.headerBg }} className="h-14 flex items-center px-4 relative z-10 border-b">
        {showLogoLeft && settings?.logo_left_exam && <div className="w-10 h-10 relative bg-white rounded-md p-1 shrink-0 mr-3"><Image src={settings.logo_left_exam} alt="L" fill className="object-contain" priority unoptimized /></div>}
        <div className="flex-1 flex flex-col text-white text-center">
          <span className="font-bold text-[9px] uppercase leading-tight tracking-tight">{settings?.school_name}</span>
          <span className="text-[6px] opacity-80 leading-tight block mt-0.5 line-clamp-2 px-1">{settings?.address}</span>
        </div>
        {showLogoRight && settings?.logo_right_exam && <div className="w-10 h-10 relative bg-white rounded-md p-1 shrink-0 ml-3"><Image src={settings.logo_right_exam} alt="R" fill className="object-contain" priority unoptimized /></div>}
      </div>

      {side === 'front' && (
        <div className="absolute top-[58px] left-0 w-full z-10 pointer-events-none">
          <div className="w-full text-center">
            <div className="inline-block bg-white border border-slate-100 px-8 py-1 rounded-full shadow-md">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none block whitespace-nowrap" style={{ color: current.footerBg }}>KARTU PESERTA UJIAN</span>
            </div>
          </div>
        </div>
      )}

      {showPhoto && (
        <div className="absolute bg-slate-50 rounded-md overflow-hidden border border-slate-200 shadow-sm z-10" style={{ left: els.photo.x, top: els.photo.y, width: els.photo.w, height: els.photo.h }}>
          {photoUrl ? <Image src={photoUrl} alt={student.name} fill className="object-cover" priority unoptimized /> : <div className="w-full h-full flex items-center justify-center bg-slate-200 text-[8px] font-black uppercase">FOTO</div>}
        </div>
      )}

      {showQr && (
        <div className="absolute bg-white p-1 rounded border shadow-sm z-10" style={{ left: els.qr.x, top: els.qr.y, width: els.qr.w, height: els.qr.h }}>
          <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFY-${student.card_code}`} alt="QR" fill className="object-contain" unoptimized />
        </div>
      )}

      {(showInfo || showValid) && (
        <div className="absolute px-2 flex flex-col gap-1.5 z-10" style={{ left: els.info.x, top: els.info.y, width: `${els.info.width || 180}px`, textAlign: els.info.align || 'left', alignItems: els.info.align === 'center' ? 'center' : (els.info.align === 'right' ? 'flex-end' : 'flex-start') }}>
          {showInfo && (
            <>
              <div className="w-full"><span className="opacity-60 text-[6px] uppercase font-black block">Nama Peserta</span><span className="font-black uppercase leading-none block" style={{ fontSize: (els.info.fontSize || 10) + 1 }}>{student.name}</span></div>
              <div className="w-full"><span className="opacity-60 text-[6px] uppercase font-black block">NIS / NISN</span><span className="font-bold block leading-none" style={{ fontSize: els.info.fontSize || 10 }}>{student.nis} / {student.nisn || '-'}</span></div>
              <div className="w-full"><span className="opacity-60 text-[6px] uppercase font-black block">Event Ujian</span><span className="font-bold uppercase block leading-tight" style={{ fontSize: (els.info.fontSize || 10) - 1 }}>{exam?.name || 'UJIAN AKHIR SEKOLAH'}</span></div>
            </>
          )}
          {showValid && (
            <div className="mt-1 w-full">
              <span className="opacity-60 text-[6px] uppercase font-black block">Masa Berlaku</span>
              <span className="font-black block leading-none" style={{ fontSize: (els.info.fontSize || 10) - 1, color: current.footerBg }}>{student.valid_until}</span>
            </div>
          )}
        </div>
      )}

      {side === 'back' && (
        <div className="absolute z-10" style={{ left: els.terms?.x || 30, top: els.terms?.y || 60, width: `${els.terms?.width || 280}px` }}>
          <div className="relative w-full flex flex-col items-center mb-4">
            <div className="w-full h-[1px] bg-slate-200 absolute top-1/2 -z-10"></div>
            <div className="bg-white border border-slate-100 px-6 py-1 rounded-full shadow-md">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none block whitespace-nowrap" style={{ color: current.headerBg }}>TATA TERTIB UJIAN</span>
            </div>
          </div>
          <p className="text-[7.5px] italic text-slate-500 leading-relaxed whitespace-pre-line text-left px-6 mt-2">{settings?.terms_exam}</p>
        </div>
      )}

      {showStamp && settings?.stamp_exam && (
        <div className="absolute z-10" style={{ left: els.stamp?.x || 220, top: els.stamp?.y || 160, width: '40px', height: '40px', transform: `scale(${els.stamp?.scale || 0.75})`, transformOrigin: 'top left' }}>
          <Image src={settings.stamp_exam} alt="S" fill className="object-contain" unoptimized />
        </div>
      )}

      {showLegalGroup && (
        <>
          <div className="absolute z-10" style={{ left: els.signature?.x || 240, top: els.signature?.y || 150, transform: `scale(${els.signature?.scale || 0.75})`, transformOrigin: 'top left' }}>
            {settings?.signature_exam && <div className="w-14 h-7 relative"><Image src={settings.signature_exam} alt="T" fill className="object-contain" unoptimized /></div>}
          </div>
          <div className="absolute z-10 text-center" style={{ left: els.principalInfo?.x || 240, top: els.principalInfo?.y || 180, width: '100px' }}>
            <p className="font-bold border-t border-slate-300 leading-none pt-1" style={{ fontSize: els.principalInfo?.fontSize || 6 }}>{settings?.principal_name}</p>
            <p className="opacity-70 mt-0.5" style={{ fontSize: (els.principalInfo?.fontSize || 6) - 1 }}>NIP: {settings?.principal_nip}</p>
          </div>
        </>
      )}

      <div style={{ backgroundColor: current.headerBg }} className="absolute bottom-0 left-0 right-0 h-1.5 z-10"></div>
    </div>
  );
}