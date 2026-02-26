"use client";

import { Student, SchoolSettings, ExamEvent, CardTemplate } from '@/app/lib/types';
import Image from 'next/image';

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
    front: { headerBg: '#1e293b', bodyBg: '#ffffff', footerBg: '#f97316', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif' },
    back: { headerBg: '#1e293b', bodyBg: '#ffffff', footerBg: '#f97316', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif' }
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

  const showLogoLeft = side === 'front' ? settings.exam_show_logo_front : settings.exam_show_logo_back;
  const showLogoRight = side === 'front' ? settings.exam_show_logo_right_front : settings.exam_show_logo_right_back;
  const showSig = side === 'front' ? settings.exam_show_sig_front : settings.exam_show_sig_back;
  const showStamp = side === 'front' ? settings.exam_show_stamp_front : settings.exam_show_stamp_back;

  if (side === 'front') {
    return (
      <div style={cardStyle} className="relative rounded-xl shadow-lg border overflow-hidden text-[10px] select-none">
        <div style={{ backgroundColor: current.headerBg }} className="h-14 flex items-center px-4 gap-3 relative z-10 shadow-sm border-b">
          {showLogoLeft && (
            <div className="w-10 h-10 relative bg-white rounded-md p-1 shadow-inner shrink-0">
              <Image src={settings.logo_left_exam} alt="Logo" fill className="object-contain" priority />
            </div>
          )}
          <div className="flex-1 flex flex-col text-white text-center">
            <span className="font-bold text-[9px] uppercase leading-tight tracking-tight">{settings.school_name}</span>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: current.footerBg }}>KARTU PESERTA UJIAN</span>
          </div>
          {showLogoRight && settings.logo_right_exam && (
            <div className="w-10 h-10 relative bg-white rounded-md p-1 shadow-inner shrink-0">
              <Image src={settings.logo_right_exam} alt="Logo R" fill className="object-contain" priority />
            </div>
          )}
        </div>

        <div className="flex h-[calc(100%-56px)] relative z-10">
          <div className="w-[100px] flex flex-col items-center justify-center p-2 gap-2 border-r border-slate-100">
            <div className="w-[75px] h-[95px] bg-slate-50 relative rounded-md overflow-hidden border border-slate-200">
              {student.photo_url ? (
                <Image src={student.photo_url} alt={student.name} fill className="object-cover" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200 text-[8px]">FOTO</div>
              )}
            </div>
          </div>
          <div className="flex-1 py-4 px-3 space-y-2 text-slate-900 relative">
            <div className="flex flex-col">
              <span className="text-slate-400 text-[6px] uppercase font-bold">Nama Peserta</span>
              <span className="font-bold text-[11px] uppercase">{student.name}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-[6px] uppercase font-bold">NIS / NISN</span>
              <span className="font-bold text-[9px]">{student.nis} / {student.nisn || '-'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-[6px] uppercase font-bold">Event Ujian</span>
              <span className="font-bold text-[8px] uppercase">{exam?.name || 'UJIAN SEKOLAH'}</span>
            </div>

            {(showSig || showStamp) && (
              <div className="absolute bottom-2 right-4 flex items-end gap-2 scale-75 origin-bottom-right">
                {showStamp && (
                  <div className="w-12 h-12 relative">
                    <Image src={settings.stamp_exam} alt="Stempel" fill className="object-contain" />
                  </div>
                )}
                {showSig && (
                  <div className="text-center">
                    <div className="w-14 h-7 relative">
                      <Image src={settings.signature_exam} alt="TTD" fill className="object-contain" />
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
    <div style={cardStyle} className="relative rounded-xl shadow-lg border overflow-hidden text-[9px] select-none p-6 flex flex-col">
      <div className="text-center mb-3 flex items-center justify-center gap-2 border-b pb-1">
        {showLogoLeft && (
          <div className="w-6 h-6 relative shrink-0">
            <Image src={settings.logo_left_exam} alt="Logo" fill className="object-contain" />
          </div>
        )}
        <h4 className="font-black text-[10px] uppercase text-slate-800">Tata Tertib Ujian</h4>
        {showLogoRight && settings.logo_right_exam && (
          <div className="w-6 h-6 relative shrink-0">
            <Image src={settings.logo_right_exam} alt="Logo R" fill className="object-contain" />
          </div>
        )}
      </div>
      <div className="flex gap-4 flex-1">
        <div className="flex-1 whitespace-pre-line text-slate-600 leading-tight italic px-2">
          {settings.terms_exam}
        </div>
        <div className="w-16 flex flex-col items-center justify-center gap-1">
           <div className="w-14 h-14 bg-white p-1 rounded border shadow-inner relative">
             <Image 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VERIFY-${student.card_code}`}
               alt="QR" fill className="object-contain" unoptimized
             />
           </div>
           <div className="text-[5px] font-bold text-slate-400">{student.card_code}</div>
        </div>
      </div>
      {(showSig || showStamp) && (
        <div className="mt-2 flex justify-end items-end relative z-10">
          <div className="text-center scale-90 origin-bottom-right relative">
             {showStamp && (
                <div className="absolute -left-8 top-0 w-16 h-8 relative mx-auto">
                   <Image src={settings.stamp_exam} alt="STAMP" fill className="object-contain opacity-70" />
                </div>
             )}
             {showSig && (
               <div className="w-16 h-8 relative mx-auto">
                  <Image src={settings.signature_exam} alt="SIG" fill className="object-contain" />
               </div>
             )}
             <p className="text-[7px] font-bold border-t pt-0.5 text-slate-800">{settings.principal_name}</p>
          </div>
        </div>
      )}
      <div style={{ backgroundColor: current.footerBg }} className="absolute bottom-0 left-0 right-0 h-1.5"></div>
    </div>
  );
}
