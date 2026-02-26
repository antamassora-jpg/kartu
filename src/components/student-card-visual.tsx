
"use client";

import { Student, SchoolSettings } from '@/app/lib/types';
import Image from 'next/image';
import { QrCode } from 'lucide-react';

// Standard ID-1 size: 85.60 × 53.98 mm
// Scale: 1mm = 3.78px approximately, but we'll use a fixed aspect ratio for display

export function StudentCardVisual({ 
  student, 
  settings, 
  side = 'front' 
}: { 
  student: Student, 
  settings: SchoolSettings, 
  side?: 'front' | 'back' 
}) {
  if (side === 'front') {
    return (
      <div className="w-[340px] h-[215px] relative rounded-xl shadow-lg border overflow-hidden bg-white text-[10px] select-none font-sans">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 z-0"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full -ml-12 -mb-12 z-0"></div>
        
        {/* Header */}
        <div className="h-14 bg-primary flex items-center px-4 gap-3 relative z-10 shadow-sm">
          <div className="w-10 h-10 relative bg-white rounded-md p-1 shadow-inner">
            <Image src={settings.logo_left} alt="Logo" fill className="object-contain" />
          </div>
          <div className="flex-1 flex flex-col text-white">
            <span className="font-bold text-[11px] uppercase leading-tight tracking-tight">{settings.school_name}</span>
            <span className="text-[6.5px] opacity-80 line-clamp-2 leading-tight">{settings.address}</span>
          </div>
          <div className="w-10 h-10 relative bg-white/10 rounded-md p-1.5 border border-white/20">
             <Image src={settings.logo_right} alt="Logo" fill className="object-contain" />
          </div>
        </div>

        <div className="flex h-[calc(100%-56px)] relative z-10">
          {/* Photo Section */}
          <div className="w-[110px] flex flex-col items-center justify-center p-3 gap-2 border-r border-dashed border-muted/50">
            <div className="w-[85px] h-[105px] bg-muted relative rounded-md overflow-hidden border-2 border-white shadow-md">
              {student.photo_url ? (
                <Image src={student.photo_url} alt={student.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-[8px] text-muted-foreground uppercase font-bold bg-muted/50">PAS FOTO</div>
              )}
            </div>
            <div className="w-14 h-14 relative bg-white border border-muted p-1 rounded-sm shadow-sm flex items-center justify-center">
               {/* Realistic looking QR Code placeholder using a service */}
               <div className="relative w-full h-full">
                 <Image 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.card_code}`}
                   alt="QR Code"
                   fill
                   className="object-contain"
                 />
               </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex-1 py-3 px-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[6.5px] uppercase font-bold tracking-wider">Nama Lengkap</span>
                <span className="font-bold text-[12px] text-primary leading-tight uppercase tracking-tight">{student.name}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[6.5px] uppercase font-bold tracking-wider">Nomor Induk Siswa (NIS/NISN)</span>
                  <span className="font-bold text-[9px]">{student.nis} / {student.nisn || '0000000000'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[6.5px] uppercase font-bold tracking-wider">Kelas & Kompetensi Keahlian</span>
                  <span className="font-bold text-[9px] uppercase">{student.class} - {student.major}</span>
                </div>
              </div>
            </div>

            {/* Signature & Stamp Area */}
            <div className="flex justify-end pr-2 pb-0 relative">
              <div className="text-center w-28">
                <div className="text-[6px] text-muted-foreground mb-1">Ditetapkan di Tana Toraja,<br/>Kepala Sekolah,</div>
                <div className="h-8 w-20 relative mx-auto mb-1">
                   {/* Signature image with relative positioning */}
                   <Image src={settings.signature_image} alt="Tanda Tangan" fill className="object-contain z-10" />
                   {/* Stamp image slightly offset and semi-transparent */}
                   <div className="absolute -top-1 -left-2 w-10 h-10 opacity-30 z-0 rotate-[-10deg]">
                     <Image src={settings.stamp_image} alt="Stempel" fill className="object-contain mix-blend-multiply" />
                   </div>
                </div>
                <div className="font-bold border-t border-black text-[7px] pt-0.5">{settings.principal_name}</div>
                <div className="text-[5.5px]">NIP. {settings.principal_nip}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="w-[340px] h-[215px] relative rounded-xl shadow-lg border overflow-hidden bg-white text-[10px] select-none font-sans p-6 flex flex-col">
      {/* Decorative Border */}
      <div className="absolute inset-2 border border-primary/10 rounded-lg pointer-events-none"></div>
      
      <div className="text-center mb-4 relative">
        <h4 className="font-bold text-[11px] uppercase border-b-2 border-primary/20 pb-1 text-primary tracking-widest">Ketentuan Pengguna Kartu</h4>
      </div>
      
      <div className="flex-1 whitespace-pre-line text-muted-foreground leading-relaxed italic text-[8.5px] px-2">
        {settings.terms_text}
      </div>
      
      <div className="mt-4 pt-3 border-t-2 border-dashed border-muted flex flex-col items-center gap-1">
        <div className="text-[7px] text-muted-foreground font-bold uppercase tracking-wider">
          Masa Berlaku Kartu: <span className="text-primary">{student.valid_until}</span>
        </div>
        <div className="text-[6px] text-muted-foreground text-center max-w-[200px] leading-tight opacity-70">
          Kartu ini adalah milik inventaris {settings.school_name}. Barangsiapa menemukan kartu ini harap mengembalikan ke alamat sekolah tersebut di atas.
        </div>
      </div>
    </div>
  );
}
