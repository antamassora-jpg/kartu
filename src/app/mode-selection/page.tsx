"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, QrCode, LogOut } from 'lucide-react';

export default function ModeSelection() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      router.push('/'); // Redirect ke HomePage jika belum login
    }
  }, [router]);

  const selectMode = (mode: 'admin' | 'scanner') => {
    localStorage.setItem('userRole', mode);
    router.push(mode === 'admin' ? '/admin' : '/scanner');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    router.push('/'); // Logout kembali ke Beranda Utama
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-2 font-headline text-primary">Pilih Mode Akses</h1>
        <p className="text-center text-muted-foreground mb-8">Silahkan pilih role Anda untuk melanjutkan</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="hover:border-primary cursor-pointer transition-all hover:shadow-lg group border-2"
            onClick={() => selectMode('admin')}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold">Mode Admin</CardTitle>
              <CardDescription>
                Kelola data siswa, cetak kartu, dan lihat rekap absensi harian & ujian.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white h-12">Pilih Admin</Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:border-secondary cursor-pointer transition-all hover:shadow-lg group border-2"
            onClick={() => selectMode('scanner')}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary group-hover:text-white transition-colors">
                <QrCode className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold">Mode Scanner</CardTitle>
              <CardDescription>
                Lakukan pemindaian kartu pelajar untuk absensi harian dan ujian siswa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full group-hover:bg-secondary group-hover:text-white h-12">Pilih Scanner</Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Button variant="ghost" onClick={handleLogout} className="gap-2 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" /> Keluar ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
