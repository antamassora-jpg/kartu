
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
  UserCheck, 
  Info, 
  Camera, 
  XCircle, 
  Loader2, 
  Zap, 
  Navigation,
  ShieldCheck,
  QrCode
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
    
    // Simulasi pencarian database lokal
    setTimeout(() => {
      const db = getDB();
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
          description: "Pastikan NIS/NISN atau Kode Kartu benar."
        });
      }
    }, 800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    setTimeout(() => {
      if (username === 'admin123' && password === 'password123') {
        localStorage.setItem('isLoggedIn', 'true');
        router.push('/mode-selection');
      } else {
        setLoginError('Username atau password salah.');
        setIsLoggingIn(false);
      }
    }, 1000);
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white font-body selection:bg-primary/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
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
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] mt-1">SMKN 2 Tana Toraja</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="px-8 rounded-full shadow-xl shadow-primary/20 gap-2 font-black uppercase tracking-widest text-[10px] h-12">
                  <LogIn className="h-4 w-4" /> Portal Masuk
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-primary p-8 text-white text-center space-y-2">
                   <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto border border-white/20 mb-2">
                      <Image src="https://iili.io/KAqSZhb.png" alt="Logo" width={40} height={40} className="object-contain invert brightness-0" unoptimized />
                   </div>
                   <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Login Akses</DialogTitle>
                   <DialogDescription className="text-white/70 font-bold text-xs">
                     Akses Internal Sistem Kartu & Absensi
                   </DialogDescription>
                </div>
                <form onSubmit={handleLogin} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                      <Input 
                        id="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="admin123"
                        required 
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                      <Input 
                        id="password" 
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
                    <Alert variant="destructive" className="py-3 rounded-xl">
                      <AlertDescription className="text-xs font-bold">{loginError}</AlertDescription>
                    </Alert>
                  )}
                  <Alert className="bg-primary/5 border-none rounded-xl">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-[10px] uppercase font-bold text-muted-foreground">
                      Demo: admin123 / password123
                    </AlertDescription>
                  </Alert>
                  <Button type="submit" className="w-full h-14 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={isLoggingIn}>
                    {isLoggingIn ? <Loader2 className="h-6 w-6 animate-spin" /> : 'MASUK SEKARANG'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 lg:pt-32 lg:pb-40 bg-white overflow-hidden border-b">
        <div className="container mx-auto px-4 relative z-10 text-center space-y-10">
           <Badge className="bg-primary/10 text-primary border-none px-6 py-2 text-[10px] font-black tracking-[0.3em] uppercase rounded-full">
              Identity Management SMKN 2 Tana Toraja
           </Badge>
           <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter">
             Digital Card <br/><span className="text-primary italic">& Tracer System.</span>
           </h1>
           <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
             Verifikasi identitas siswa secara instan melalui sistem pelacakan berbasis database terpadu.
           </p>
        </div>
        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </section>

      {/* Tracer Section */}
      <section className="py-24 bg-slate-50 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-2xl border-none rounded-[3rem] overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                  <div className="md:col-span-3 p-10 lg:p-16 space-y-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                         <Navigation className="h-5 w-5 fill-primary" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em]">Identity Tracer Tool</span>
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Lacak Identitas.</h3>
                      <p className="text-muted-foreground font-medium">Gunakan NIS, NISN, atau Kode Kartu untuk memverifikasi data.</p>
                    </div>

                    <form onSubmit={handleSearch} className="relative group">
                      <div className="absolute left-5 top-5 h-6 w-6 text-slate-400 group-focus-within:text-primary transition-colors">
                        <Search />
                      </div>
                      <Input 
                        placeholder="Masukkan NIS / NISN / KODE..." 
                        className="pl-14 h-16 text-xl border-2 border-slate-100 bg-slate-50/50 focus-visible:bg-white rounded-2xl font-bold"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button 
                        type="submit" 
                        className="absolute right-3 top-3 h-10 px-8 font-black rounded-xl text-[10px] tracking-widest"
                        disabled={isSearching}
                      >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'LACAK'}
                      </Button>
                    </form>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                         <UserCheck className="h-6 w-6 text-primary" />
                         <span className="text-[8px] font-black uppercase tracking-widest opacity-50">NIS/NISN</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                         <QrCode className="h-6 w-6 text-primary" />
                         <span className="text-[8px] font-black uppercase tracking-widest opacity-50">QR-Code</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                         <Camera className="h-6 w-6 text-primary" />
                         <span className="text-[8px] font-black uppercase tracking-widest opacity-50">ID Card</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-slate-900 p-10 lg:p-16 text-white flex flex-col justify-center relative">
                    <div className="relative z-10 space-y-8">
                      {hasSearched && searchResult ? (
                        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8 text-center">
                          <div className="w-32 h-44 bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 mx-auto">
                            <Image 
                              src={searchResult.photo_url || 'https://picsum.photos/seed/user/300/400'} 
                              alt="Foto" fill className="object-cover" unoptimized 
                            />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-2xl font-black uppercase tracking-tight">{searchResult.name}</h4>
                            <p className="text-[10px] text-primary font-black tracking-widest uppercase">{searchResult.class} • {searchResult.major}</p>
                          </div>
                          <div className="space-y-2">
                             <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center border border-white/5">
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Status</span>
                                <Badge className="bg-emerald-500 text-emerald-950 border-none text-[9px] font-black uppercase">{searchResult.status}</Badge>
                             </div>
                          </div>
                          <Button variant="secondary" className="w-full font-black h-12 rounded-xl text-[10px] tracking-widest uppercase" asChild>
                            <Link href={`/verify/${searchResult.card_code}`}>VERIFIKASI PENUH</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center space-y-8 opacity-40 flex flex-col items-center py-10">
                          <Zap className="h-20 w-20 text-white" fill="white" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Siap Melacak Database</p>
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

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
             &copy; {new Date().getFullYear()} EDU-SYNC SYSTEM. SMKN 2 TANA TORAJA.
          </p>
        </div>
      </footer>
    </div>
  );
}
