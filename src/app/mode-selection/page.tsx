
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, QrCode, LogOut, ArrowLeft } from 'lucide-react';

export default function ModeSelection() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      router.push('/'); // Redirect ke beranda portal jika belum login
    }
  }, [router]);

  const selectMode = (mode: 'admin' | 'scanner') => {
    localStorage.setItem('userRole', mode);
    router.push(mode === 'admin' ? '/admin' : '/scanner');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    router.push('/'); // Kembali ke Portal Beranda Profesional (Root)
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-12">
           <div className="w-16 h-16 bg-white rounded-2xl p-3 shadow-xl mb-4 border border-slate-100">
             <img src="https://iili.io/KAqSZhb.png" alt="Logo" className="w-full h-full object-contain" />
           </div>
           <h1 className="text-4xl font-black text-center mb-2 font-headline text-primary tracking-tighter uppercase">Pilih Mode Akses</h1>
           <p className="text-center text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">SMKN 2 Tana Toraja • EduCard System</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card 
            className="hover:border-primary cursor-pointer transition-all hover:shadow-2xl group border-4 border-transparent bg-white rounded-[2.5rem] overflow-hidden p-4"
            onClick={() => selectMode('admin')}
          >
            <CardHeader className="text-center pt-8">
              <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Mode Admin</CardTitle>
              <CardDescription className="text-xs font-medium leading-relaxed mt-2">
                Kelola database master, cetak kartu massal, dan monitoring log database sekolah.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">MASUK ADMIN</Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:border-secondary cursor-pointer transition-all hover:shadow-2xl group border-4 border-transparent bg-white rounded-[2.5rem] overflow-hidden p-4"
            onClick={() => selectMode('scanner')}
          >
            <CardHeader className="text-center pt-8">
              <div className="w-20 h-20 bg-secondary/5 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary group-hover:text-white transition-all duration-500 shadow-inner">
                <QrCode className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Mode Scanner</CardTitle>
              <CardDescription className="text-xs font-medium leading-relaxed mt-2">
                Pemindaian kartu untuk absensi harian, event ujian, dan verifikasi identitas cepat.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button variant="outline" className="w-full group-hover:bg-secondary group-hover:text-white h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">MASUK SCANNER</Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center space-y-4">
          <div className="w-full h-px bg-slate-200"></div>
          <Button variant="ghost" onClick={handleLogout} className="gap-3 text-slate-400 hover:text-destructive h-12 px-8 font-black uppercase text-[10px] tracking-widest">
            <LogOut className="h-4 w-4" /> KELUAR KE PORTAL UTAMA
          </Button>
        </div>
      </div>
    </div>
  );
}
