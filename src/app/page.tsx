
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  QrCode, 
  BarChart3, 
  ShieldCheck, 
  Search, 
  ArrowRight,
  CheckCircle2,
  LogIn,
  UserCheck,
  Info,
  Camera,
  XCircle,
  Loader2
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(false);
    
    // Simulasi pencarian database
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
          description: "Pastikan NIS/NISN atau Kode Kartu yang Anda masukkan benar."
        });
      }
    }, 800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin123' && password === 'password123') {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/mode-selection');
    } else {
      setLoginError('Username atau password salah.');
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white font-body">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <Image 
                src="https://iili.io/KAqSZhb.png" 
                alt="Logo SMKN 2 Tana Toraja" 
                fill 
                className="object-contain"
                data-ai-hint="school logo"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-primary leading-none tracking-tight">EduCard Sync</span>
              <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Tana Toraja</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="px-6 rounded-full shadow-lg shadow-primary/20 gap-2">
                  <LogIn className="h-4 w-4" /> Portal Masuk
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 relative mb-2">
                    <Image src="https://iili.io/KAqSZhb.png" alt="Logo" fill className="object-contain" />
                  </div>
                  <DialogTitle className="text-2xl font-black text-primary">Login Internal</DialogTitle>
                  <DialogDescription className="text-center">
                    Masuk sebagai Admin atau Scanner Petugas untuk mengelola layanan kartu.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLogin} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="admin123"
                      required 
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••"
                      required 
                      className="h-11"
                    />
                  </div>
                  {loginError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">{loginError}</AlertDescription>
                    </Alert>
                  )}
                  <Alert className="bg-muted border-none">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-[10px] uppercase font-bold text-muted-foreground">
                      Demo: admin123 / password123
                    </AlertDescription>
                  </Alert>
                  <Button type="submit" className="w-full h-12 text-lg font-bold">Masuk Sekarang</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      {/* Hero & Card Tracker Section */}
      <section className="relative py-20 bg-slate-50 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
           <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-[100px]"></div>
           <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full blur-[100px]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-[10px] font-black tracking-widest uppercase">
              Official Platform SMKN 2 Tana Toraja
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tighter">
              Lacak & Verifikasi <br/><span className="text-primary">Kartu Digital</span> Anda.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed px-10">
              Verifikasi status kartu pelajar, kartu ujian, dan ID Card secara instan melalui sistem pencarian terpadu kami.
            </p>
          </div>

          {/* Central Search Tool */}
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                  <div className="md:col-span-3 p-8 lg:p-12 space-y-8 bg-white">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-800">Pelacak Identitas</h3>
                      <p className="text-sm text-muted-foreground">Masukkan NISN, NIS, atau Kode QR untuk mencari data.</p>
                    </div>

                    <form onSubmit={handleSearch} className="relative">
                      <Search className="absolute left-4 top-4 h-6 w-6 text-muted-foreground" />
                      <Input 
                        placeholder="Masukkan NISN / NIS / Kode Kartu..." 
                        className="pl-12 h-14 text-lg border-2 focus-visible:ring-primary rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button 
                        type="submit" 
                        className="absolute right-2 top-2 h-10 px-6 font-bold rounded-lg"
                        disabled={isSearching}
                      >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'CARI DATA'}
                      </Button>
                    </form>

                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl group hover:bg-primary/5 cursor-pointer border border-transparent hover:border-primary/20 transition-all">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-primary group-hover:scale-110 transition-transform">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase">Via NISN</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl group hover:bg-secondary/5 cursor-pointer border border-transparent hover:border-secondary/20 transition-all">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-secondary group-hover:scale-110 transition-transform">
                          <Camera className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase">Scan Foto</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl group hover:bg-orange-500/5 cursor-pointer border border-transparent hover:border-orange-500/20 transition-all">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500 group-hover:scale-110 transition-transform">
                          <QrCode className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase">Via Code</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-primary p-8 lg:p-12 text-white flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10 space-y-6">
                      {hasSearched && searchResult ? (
                        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-24 h-32 bg-white rounded-xl overflow-hidden shadow-2xl border-4 border-white/20">
                              <Image 
                                src={searchResult.photo_url || 'https://picsum.photos/seed/user/300/400'} 
                                alt="Foto" fill className="object-cover" unoptimized 
                              />
                            </div>
                            <div className="text-center">
                              <h4 className="text-xl font-black uppercase leading-tight">{searchResult.name}</h4>
                              <p className="text-xs text-white/70 font-bold mt-1 tracking-widest">{searchResult.class} - {searchResult.major}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                             <div className="bg-white/10 p-3 rounded-xl flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase opacity-60">Status Kartu</span>
                                <Badge className="bg-green-500 text-white border-none text-[10px]">{searchResult.status}</Badge>
                             </div>
                             <div className="bg-white/10 p-3 rounded-xl flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase opacity-60">Masa Berlaku</span>
                                <span className="text-xs font-black">{searchResult.valid_until}</span>
                             </div>
                          </div>
                          <Button variant="secondary" className="w-full font-bold h-11" asChild>
                            <Link href={`/verify/${searchResult.card_code}`}>Detail Selengkapnya</Link>
                          </Button>
                        </div>
                      ) : hasSearched ? (
                        <div className="text-center space-y-4 py-10">
                          <XCircle className="h-16 w-16 mx-auto text-white/20" />
                          <h4 className="text-xl font-bold">Data Tidak Ditemukan</h4>
                          <p className="text-sm opacity-70">Siswa belum terdaftar atau kode salah.</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-4 py-10 opacity-60">
                          <Info className="h-16 w-16 mx-auto" />
                          <h4 className="text-xl font-bold">Menunggu Input...</h4>
                          <p className="text-sm">Hasil pencarian akan muncul secara otomatis di sini.</p>
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

      {/* Stats Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="space-y-4">
              <div className="text-5xl font-black text-primary">1.2K+</div>
              <h4 className="font-black uppercase tracking-widest text-xs text-slate-500">Siswa Terverifikasi</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">Seluruh siswa SMKN 2 Tana Toraja telah memiliki identitas digital yang valid.</p>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-black text-secondary">15K+</div>
              <h4 className="font-black uppercase tracking-widest text-xs text-slate-500">Log Absensi Harian</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">Sistem absensi QR yang cepat dan akurat mencatat setiap kehadiran siswa.</p>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-black text-orange-500">100%</div>
              <h4 className="font-black uppercase tracking-widest text-xs text-slate-500">Akurasi Data</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">Integritas data terjamin melalui enkripsi kode kartu yang unik.</p>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-black text-emerald-500">98%</div>
              <h4 className="font-black uppercase tracking-widest text-xs text-slate-500">Kepuasan Layanan</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">Mempermudah administrasi sekolah bagi staf, siswa, dan orang tua.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-slate-800 pb-12 mb-12">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 bg-white p-1 rounded-lg">
                <Image src="https://iili.io/KAqSZhb.png" alt="Logo" fill className="object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-white text-xl leading-none">EduCard Sync</span>
                <span className="text-[9px] uppercase font-bold tracking-[0.3em] opacity-50">SMKN 2 Tana Toraja</span>
              </div>
            </div>
            <div className="flex gap-10 text-sm font-bold uppercase tracking-widest">
              <Link href="#" className="hover:text-primary transition-colors">Visi & Misi</Link>
              <Link href="#" className="hover:text-primary transition-colors">Bantuan</Link>
              <Link href="#" className="hover:text-primary transition-colors">Kontak</Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
            <p>&copy; 2024 SMKN 2 TANA TORAJA. POWERED BY EDUCARD SYNC ENGINE.</p>
            <div className="flex gap-8">
              <span>Security Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
