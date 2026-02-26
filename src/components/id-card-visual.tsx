
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
  // Parsing config dari template jika ada
  let config: any = {};
  try {
    if (template?.config_json) {
      config = JSON.parse(template.config_json);
    }
  } catch (e) {
    console.error("Failed to parse template config", e);
  }

  const primaryColor = config.primary || '#1B3C33'; // Default Hijau Gelap jika tidak ada config

  // Ukuran 7.3cm x 11.1cm (276px x 420px pada 96 DPI)
  const cardStyle = {
    width: '276px',
    height: '420px',
    backgroundColor: primaryColor
  };

  if (side === 'front') {
    return (
      <div 
        style={cardStyle} 
        className="relative rounded-2xl shadow-2xl border overflow-hidden text-white select-none font-sans flex flex-col"
      >
        {/* Latar Belakang Pattern Batik & Rays */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/batik-fractal.png')] opacity-50"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[spin_20s_linear_infinite]"></div>
        </div>

        {/* Lubang Gantungan (Visual Only) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-black/40 border border-white/20 z-30"></div>

        {/* Header & Logo Section */}
        <div className="relative z-20 pt-12 px-6 flex flex-col items-center">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 relative bg-white/10 rounded-lg p-1.5 backdrop-blur-sm border border-white/20">
              <Image src={settings.logo_left} alt="Logo" fill className="object-contain" priority />
            </div>
            <div className="flex flex-col">
              <h2 className="font-black text-[11px] uppercase leading-none tracking-tight">Madrasah Aliyah</h2>
              <h2 className="font-black text-[11px] uppercase leading-none tracking-tight text-emerald-400">Negeri 2 Tana Toraja</h2>
            </div>
          </div>
        </div>

        {/* Ikon Vertikal Sisi Kanan */}
        <div className="absolute top-14 right-0 w-8 flex flex-col items-center gap-2 py-4 bg-white/10 backdrop-blur-md rounded-l-lg border-l border-y border-white/10 z-20">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[6px] font-bold">{i}</div>
          ))}
        </div>

        {/* Foto Utama (Large Integration) */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full mt-10">
            {student.photo_url ? (
              <div className="relative w-full h-full">
                <Image 
                  src={student.photo_url} 
                  alt={student.name} 
                  fill 
                  className="object-cover object-top opacity-80" 
                  priority 
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
                  style={{ backgroundImage: `linear-gradient(to top, ${primaryColor}, transparent, transparent)` }}
                ></div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[8px] text-white/20 uppercase font-bold">PHOTO</div>
            )}
          </div>
        </div>

        {/* Data Diri (Bottom Section) */}
        <div className="relative z-20 mt-auto p-6 space-y-2">
          <div className="space-y-0.5">
            <h1 className="text-xl font-black uppercase tracking-tight leading-none drop-shadow-md">{student.name}</h1>
            <div className="inline-block px-2 py-0.5 bg-emerald-500 rounded text-[8px] font-bold uppercase tracking-widest">
               {student.major}
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-[7px] text-white/60 font-medium">Instagram</p>
              <p className="text-[8px] font-bold">@smkn2tanatoraja</p>
            </div>
            
            {/* Logo Rotated on Side */}
            <div className="transform rotate-90 origin-bottom-right translate-x-1 mb-2">
              <span className="text-xl font-black italic opacity-30 tracking-tighter">EDUCARD</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar Accent */}
        <div className="h-1.5 w-full bg-emerald-500 relative z-20"></div>
      </div>
    );
  }

  // Tampak Belakang
  return (
    <div 
      style={cardStyle} 
      className="relative rounded-2xl shadow-2xl border overflow-hidden text-white select-none font-sans flex flex-col p-8"
    >
      <div className="absolute inset-0 opacity-5">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/batik-fractal.png')]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center h-full">
        <div className="w-12 h-12 relative mb-2">
           <Image src={settings.logo_left} alt="Logo" fill className="object-contain" />
        </div>
        <h3 className="font-black text-xs text-center uppercase tracking-tight mb-8">
          SMKN 2 TANA TORAJA<br/>
          <span className="text-[7px] font-normal opacity-60">Identity Verification System</span>
        </h3>

        <div className="bg-white p-3 rounded-2xl shadow-xl mb-8">
           <div className="relative w-32 h-32">
             <Image 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VERIFY-${student.card_code}`}
               alt="QR"
               fill
               className="object-contain"
               unoptimized
             />
           </div>
        </div>

        <div className="flex-1 w-full space-y-4 text-center">
           <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-400 border-b border-white/10 pb-2">Terms and Conditions</h4>
           <div className="space-y-3 text-[8px] text-white/70 leading-relaxed italic">
              <p>1. Kartu ini merupakan identitas resmi siswa di lingkungan sekolah.</p>
              <p>2. Wajib dibawa dan dikenakan selama jam operasional sekolah.</p>
              <p>3. Penyalahgunaan kartu ini dapat dikenakan sanksi kedisiplinan.</p>
              <p>4. Jika menemukan kartu ini, harap kembalikan ke bagian kesiswaan.</p>
           </div>
        </div>

        <div className="mt-auto pt-4 border-t border-white/10 w-full text-center">
           <p className="text-[6px] uppercase tracking-[0.3em] font-bold opacity-40">Verified by EduCard Sync</p>
        </div>
      </div>
    </div>
  );
}
