
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  CheckCircle2,
  Users,
  CreditCard,
  CalendarCheck,
  QrCode,
  Camera,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getDB } from '@/app/lib/db';
import { Student } from '@/app/lib/types';
import { toast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';

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

  // Camera Scan States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = (query: string = searchQuery) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(false);
    
    setTimeout(() => {
      const db = getDB();
      // Menghapus prefix VERIFY- jika ada (biasanya dari QR)
      const cleanQuery = query.replace('VERIFY-', '').trim();
      
      const found = db.students.find(s => 
        s.nis === cleanQuery || 
        s.nisn === cleanQuery || 
        s.card_code === cleanQuery ||
        s.card_code === `VERIFY-${cleanQuery}` ||
        `VERIFY-${s.card_code}` === query
      );
      
      setSearchResult(found || null);
      setIsSearching(false);
      setHasSearched(true);
      
      if (!found) {
        toast({
          variant: "destructive",
          title: "Data Tidak Ditemukan",
          description: "Nomor induk atau kode kartu tidak terdaftar di database kami."
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
        toast({ title: "Akses Diberikan", description: "Selamat datang di panel kontrol EduCard Sync." });
        router.push('/mode-selection');
      } else {
        setLoginError('Kredensial tidak valid. Silahkan hubungi IT sekolah.');
        setIsLoggingIn(false);
      }
    }, 1500);
  };

  const startScanner = async () => {
    setIsScannerOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Simulasi penemuan QR code setelah 3 detik
      setTimeout(() => {
        const db = getDB();
        if (db.students.length > 0) {
          const randomStudent = db.students[0];
          setSearchQuery(randomStudent.card_code);
          stopScanner();
          handleSearch(randomStudent.card_code);
          toast({ title: "Barcode Terdeteksi", description: `Memproses kartu: ${randomStudent.card_code}` });
        }
      }, 3500);

    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasCameraPermission(false);
    }
  };

  const stopScanner = () => {
    setIsScannerOpen(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const chartData = [
    { name: 'Sen', rate: 95 },
    { name: 'Sel', rate: 98 },
    { name: 'Rab', rate: 92 },
    { name: 'Kam', rate: 96 },
    { name: 'Jum', rate: 94 },
  ];

  if (!isMounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white font-body selection:bg-primary/20">
      {/* Header Portal */}
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
              <span className="font-black text-xl text-primary leading-none tracking-tighter uppercase">EduCard Portal</span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1">SMKN 2 Tana Toraja</span>
            </div>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="px-8 rounded-full shadow-xl shadow-primary/20 gap-2 font-black uppercase tracking-widest text-[10px] h-12">
                <LogIn className="h-4 w-4" /> Portal Akses
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
              <div className="bg-primary p-10 text-white text-center space-y-3 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto border border-white/20 mb-2">
                    <ShieldCheck className="h-8 w-8 text-white" />
                 </div>
                 <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Login Sistem</DialogTitle>
                 <DialogDescription className="text-white/70 font-bold text-xs uppercase tracking-widest">
                   Admin & Scanner Management
                 </DialogDescription>
              </div>
              <form onSubmit={handleLogin} className="p-10 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</Label>
                    <Input 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="Masukkan ID Anda"
                      required 
                      className="h-12 rounded-xl border-slate-200 bg-slate-50"
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
                      className="h-12 rounded-xl border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>
                {loginError && (
                  <Alert variant="destructive" className="py-3 rounded-xl">
                    <AlertDescription className="text-xs font-bold">{loginError}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full h-14 text-sm font-black uppercase tracking-widest shadow-lg rounded-2xl" disabled={isLoggingIn}>
                  {isLoggingIn ? <Loader2 className="h-6 w-6 animate-spin" /> : 'VERIFIKASI & MASUK'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 text-center lg:text-left">
            <Badge className="bg-primary/5 text-primary border-primary/20 px-6 py-2 text-[10px] font-black tracking-[0.4em] uppercase rounded-full">
              Integrated School Smart System
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter uppercase">
              Digital Identity<br/><span className="text-primary italic">Tracer Hub.</span>
            </h1>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
              Verifikasi identitas siswa, cek keabsahan kartu, dan pantau log kehadiran melalui portal terpadu SMKN 2 Tana Toraja.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border">
                 <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Verified Database</span>
               </div>
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border">
                 <Zap className="h-4 w-4 text-orange-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Instant Sync</span>
               </div>
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100 shadow-2xl relative">
             <div className="flex items-center justify-between mb-8">
                <h4 className="font-black uppercase tracking-tighter text-slate-400">Statistik Kehadiran Pekan Ini</h4>
                <CalendarCheck className="h-5 w-5 text-primary opacity-30" />
             </div>
             <div className="h-[280px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <RechartsTooltip />
                    <Bar dataKey="rate" fill="#2E50B8" radius={[6, 6, 0, 0]} barSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </section>

      {/* Identity Tracer - CORE FEATURE */}
      <section className="py-24 bg-slate-900 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="space-y-4">
               <h2 className="text-4xl font-black text-white tracking-tight uppercase">Identity Tracer System</h2>
               <p className="text-white/40 font-medium max-w-xl mx-auto">Verifikasi identitas siswa secara instan melalui sistem sinkronisasi database log admin menggunakan NIS atau pemindaian barcode langsung.</p>
            </div>

            <Card className="bg-white/5 border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-xl shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <CardContent className="p-10 space-y-10">
                <div className="flex flex-col md:flex-row gap-4 items-center max-w-3xl mx-auto">
                  <div className="flex-1 relative group w-full">
                    <Search className="absolute left-6 top-6 h-8 w-8 text-white/20 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Masukkan NIS / NISN / Kode Kartu..." 
                      className="pl-20 h-20 text-lg border-2 border-white/10 bg-white/5 text-white focus-visible:ring-primary rounded-[1.5rem] font-black uppercase placeholder:normal-case placeholder:font-medium placeholder:text-white/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button 
                      onClick={() => handleSearch()}
                      className="h-20 px-8 font-black rounded-[1.5rem] text-[10px] tracking-widest shadow-2xl bg-primary hover:bg-primary/90 min-w-[150px]"
                      disabled={isSearching}
                    >
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'TELUSURI DATA'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={startScanner}
                      className="h-20 w-20 flex flex-col items-center justify-center rounded-[1.5rem] border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    >
                      <QrCode className="h-6 w-6 mb-1" />
                      <span className="text-[7px] font-black uppercase tracking-tighter">SCAN</span>
                    </Button>
                  </div>
                </div>

                {hasSearched && searchResult ? (
                  <div className="animate-in fade-in zoom-in-95 duration-700 bg-white rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center text-left">
                    <div className="w-48 h-64 bg-slate-100 rounded-3xl overflow-hidden relative shadow-2xl shrink-0 border-4 border-slate-50">
                       <Image 
                         src={searchResult.photo_url || 'https://picsum.photos/seed/placeholder/300/400'} 
                         alt="Foto Siswa" fill className="object-cover" unoptimized 
                       />
                    </div>
                    <div className="flex-1 space-y-6">
                       <div className="flex items-center justify-between">
                          <Badge className="bg-emerald-500 text-white font-black uppercase text-[9px] tracking-[0.2em] px-4 py-1.5 rounded-full">Kartu Aktif & Terverifikasi</Badge>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{searchResult.card_code}</span>
                       </div>
                       <div>
                         <h3 className="text-5xl font-black text-slate-900 leading-none uppercase tracking-tighter">{searchResult.name}</h3>
                         <p className="text-primary font-black uppercase tracking-[0.3em] text-xs mt-3">{searchResult.class} - {searchResult.major}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                          <div>
                             <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Identitas (NIS/NISN)</p>
                             <p className="text-base font-bold text-slate-800">{searchResult.nis} / {searchResult.nisn || '-'}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Tahun Ajaran</p>
                             <p className="text-base font-bold text-slate-800">{searchResult.school_year}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : hasSearched && !searchResult ? (
                   <div className="py-24 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10">
                      <p className="text-white/20 font-black uppercase tracking-[0.5em] text-xl animate-pulse">
                        Data Tidak Ditemukan Dalam Log Database
                      </p>
                      <p className="text-white/10 text-xs font-bold uppercase mt-4">Pastikan NIS atau Kode Kartu sudah benar</p>
                   </div>
                ) : (
                  <div className="flex justify-center gap-16 opacity-10 py-10">
                     <Users className="h-16 w-16 text-white" />
                     <CreditCard className="h-16 w-16 text-white" />
                     <ShieldCheck className="h-16 w-16 text-white" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Camera Scan Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg relative space-y-6">
            <div className="flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                 <QrCode className="h-6 w-6 text-primary" />
                 <h3 className="font-black uppercase tracking-tighter text-xl">Scan Card Barcode</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={stopScanner} className="text-white hover:bg-white/10 rounded-full h-12 w-12">
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="aspect-square w-full rounded-[3rem] border-4 border-dashed border-white/20 overflow-hidden relative bg-white/5 group">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-64 h-64 border-2 border-primary rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary -translate-x-1 -translate-y-1"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary translate-x-1 -translate-y-1"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary -translate-x-1 translate-y-1"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary translate-x-1 translate-y-1"></div>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary animate-[bounce_3s_infinite] opacity-50 shadow-[0_0_20px_rgba(46,80,184,1)]"></div>
                 </div>
              </div>
              
              {!hasCameraPermission && hasCameraPermission !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-center p-8">
                  <div className="space-y-4">
                    <Camera className="h-12 w-12 text-destructive mx-auto" />
                    <p className="text-white font-bold uppercase text-xs tracking-widest">Izin kamera diperlukan untuk memindai barcode</p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-center text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              Posisikan QR Code atau Barcode Kartu Pelajar di dalam bingkai pemindaian
            </p>
          </div>
        </div>
      )}

      {/* Footer Portal */}
      <footer className="bg-white py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-6">
               <div className="relative w-14 h-14 opacity-50 grayscale hover:grayscale-0 transition-all">
                 <Image src="https://iili.io/KAqSZhb.png" alt="Logo" fill className="object-contain" unoptimized />
               </div>
               <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-900">EduCard Sync Tana Toraja</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 italic">Building a Smart & Digital Institution</p>
               </div>
            </div>
            <div className="flex gap-8">
               <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Panduan Penggunaan</Link>
               <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Kebijakan Privasi</Link>
               <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Support IT</Link>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t text-center">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
               &copy; {new Date().getFullYear()} SMKN 2 Tana Toraja. SEMUA HAK CIPTA DILINDUNGI.
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
