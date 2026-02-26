"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  LogIn, 
  ShieldCheck, 
  Info, 
  Loader2, 
  Zap, 
  Navigation,
  CheckCircle2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getDB } from '@/app/lib/db';
import { Student } from '@/app/lib/types';
import { toast } from '@/hooks/use-toast';

export default function LandingPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(false);
    
    setTimeout(() => {
      const db = getDB();
      // Mencari berdasarkan NIS, NISN, atau Kode Kartu
      const found = db.students.find(s => 
        s.nis === searchQuery || 
        s.nisn === searchQuery || 
        s.card_code === searchQuery ||
        s.card_code === `VERIFY-${searchQuery}`
      );
      
      setSearchResult(found || null);
      setIsSearching(false);
      setHasSearched(true);
      
      if (!found) {
        toast({
          variant: "destructive",
          title: "Data Tidak Ditemukan",
          description: "Pastikan nomor induk atau kode kartu sudah benar sesuai data di sekolah."
        });
      }
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    setTimeout(() => {
      if (username === 'admin123' && password === 'password123') {
        localStorage.setItem('isLoggedIn', 'true');
        toast({ title: "Login Berhasil", description: "Selamat datang kembali di panel EduCard Sync." });
        router.push('/mode-selection');
      } else {
        setLoginError('Username atau password salah.');
        setIsLoggingIn(false);
      }
    }, 1200);
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white font-body selection:bg-primary/20">
      {/* Navbar Modern */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 bg-slate-50 rounded-xl p-2 shadow-sm border border-slate-100">
              <Image 
                src="https://iili.io/KAqSZhb.png" 
                alt="Logo Sekolah" 
                fill 
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl text-primary leading-none tracking-tighter uppercase">EduCard Sync</span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1">SMKN 2 Tana Toraja</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="px-8 rounded-full shadow-xl shadow-primary/20 gap-2 font-black uppercase tracking-widest text-[10px] h-12">
                  <LogIn className="h-4 w-4" /> Portal Masuk
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-primary p-10 text-white text-center space-y-3 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                   <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto border border-white/20 mb-2">
                      <ShieldCheck className="h-8 w-8 text-white" />
                   </div>
                   <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Akses Internal</DialogTitle>
                   <DialogDescription className="text-white/70 font-bold text-xs uppercase tracking-widest">
                     Management & Scanning System
                   </DialogDescription>
                </div>
                <form onSubmit={handleLogin} className="p-10 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</Label>
                      <Input 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="admin123"
                        required 
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                      <Input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••"
                        required 
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white"
                      />
                    </div>
                  </div>
                  {loginError && (
                    <Alert variant="destructive" className="py-3 rounded-xl border-destructive/20 bg-destructive/5">
                      <AlertDescription className="text-xs font-bold">{loginError}</AlertDescription>
                    </Alert>
                  )}
                  <Alert className="bg-primary/5 border-none rounded-xl">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-[10px] uppercase font-bold text-muted-foreground">
                      Demo: admin123 / password123
                    </AlertDescription>
                  </Alert>
                  <Button type="submit" className="w-full h-14 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 rounded-2xl" disabled={isLoggingIn}>
                    {isLoggingIn ? <Loader2 className="h-6 w-6 animate-spin" /> : 'MASUK SEKARANG'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      {/* Hero Header Section */}
      <section className="relative pt-24 pb-32 lg:pt-32 lg:pb-40 bg-white overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
           <Badge className="bg-primary/5 text-primary border-primary/20 px-6 py-2 text-[10px] font-black tracking-[0.4em] uppercase rounded-full">
              Sistem Sinkronisasi Kartu & Absensi Digital
           </Badge>
           <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase">
             Identity <span className="text-primary">Sync.</span><br/><span className="italic opacity-30 text-5xl md:text-7xl">Smart Control.</span>
           </h1>
           <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
             Platform verifikasi kartu pelajar terpadu untuk monitoring kehadiran dan administrasi digital SMKN 2 Tana Toraja.
           </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]"></div>
      </section>

      {/* Tracer Center - Fitur Pencarian */}
      <section className="py-24 bg-slate-50 relative border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-5 min-h-[500px]">
                  <div className="md:col-span-3 p-10 lg:p-20 space-y-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                         <Navigation className="h-5 w-5 fill-primary" />
                         <span className="text-[10px] font-black uppercase tracking-[0.4em]">Identity Tracer Tool</span>
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">Lacak Validitas.</h3>
                      <p className="text-muted-foreground font-medium">Verifikasi data siswa melalui NIS, NISN, atau Kode Kartu untuk memastikan keaslian kartu pelajar.</p>
                    </div>

                    <form onSubmit={handleSearch} className="relative group">
                      <div className="absolute left-6 top-6 h-6 w-6 text-slate-300 group-focus-within:text-primary transition-colors">
                        <Search />
                      </div>
                      <Input 
                        placeholder="Masukkan NIS / NISN / KODE KARTU..." 
                        className="pl-16 h-20 text-xl border-2 border-slate-100 bg-slate-50/50 focus-visible:bg-white rounded-3xl font-black uppercase placeholder:normal-case placeholder:font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button 
                        type="submit" 
                        className="absolute right-4 top-4 h-12 px-10 font-black rounded-2xl text-[10px] tracking-widest shadow-xl shadow-primary/20"
                        disabled={isSearching}
                      >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'TELUSURI DATA'}
                      </Button>
                    </form>

                    <div className="flex flex-wrap gap-8 pt-6">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Real-time DB Sync</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Official Status</span>
                       </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-slate-900 p-10 lg:p-16 text-white flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary opacity-10 blur-3xl rounded-full translate-x-1/2"></div>
                    <div className="relative z-10 space-y-8">
                      {hasSearched && searchResult ? (
                        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8 text-center">
                          <div className="w-40 h-52 bg-white/10 backdrop-blur-2xl rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/20 mx-auto group relative">
                            <Image 
                              src={searchResult.photo_url || 'https://picsum.photos/seed/user/300/400'} 
                              alt="Profil Siswa" fill className="object-cover transition-transform group-hover:scale-110 duration-700" unoptimized 
                            />
                            {searchResult.status === 'Aktif' && (
                              <div className="absolute top-2 right-2 bg-emerald-500 p-1.5 rounded-full">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-3xl font-black uppercase tracking-tighter leading-none">{searchResult.name}</h4>
                            <p className="text-[11px] text-primary font-black tracking-[0.2em] uppercase">{searchResult.class} • {searchResult.major}</p>
                          </div>
                          <div className="bg-white/5 p-5 rounded-2xl flex justify-between items-center border border-white/5 backdrop-blur-sm">
                             <div className="text-left">
                                <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Status Keanggotaan</p>
                                <p className="text-xs font-black uppercase text-emerald-400 mt-1">{searchResult.status}</p>
                             </div>
                             <div className="w-12 h-12 bg-white p-1 rounded-lg">
                                <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VERIFY-${searchResult.card_code}`} alt="QR" width={100} height={100} unoptimized />
                             </div>
                          </div>
                          <Button variant="secondary" className="w-full font-black h-14 rounded-2xl text-[10px] tracking-widest uppercase shadow-2xl" asChild>
                            <Link href={`/verify/${searchResult.card_code}`}>KONFIRMASI IDENTITAS</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center space-y-8 opacity-20 flex flex-col items-center py-10">
                          <div className="relative">
                            <Zap className="h-24 w-24 text-white" fill="white" />
                            <div className="absolute inset-0 bg-white blur-2xl opacity-50 animate-pulse"></div>
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Siap Untuk Pemindaian Data</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-white py-16">
        <div className="container mx-auto px-4">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-100 pt-10">
              <div className="flex items-center gap-4">
                 <Image src="https://iili.io/KAqSZhb.png" alt="Logo Sekolah" width={32} height={32} unoptimized />
                 <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">EduCard Sync Tana Toraja</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                 &copy; {new Date().getFullYear()} SMK NEGERI 2 TANA TORAJA. POWERED BY EDUCARD.
              </p>
              <div className="flex gap-6">
                 <Link href="#" className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline">Privasi</Link>
                 <Link href="#" className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline">Ketentuan</Link>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
