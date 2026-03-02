"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  LogIn, 
  ShieldCheck, 
  Loader2, 
  Users, 
  CreditCard, 
  CalendarCheck, 
  QrCode, 
  X,
  Award,
  Contact,
  Activity,
  XCircle
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
import { Student, SchoolSettings, CardTemplate, ExamEvent, AttendanceLog } from '@/app/lib/types';
import { toast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { StudentCardVisual } from '@/components/student-card-visual';
import { ExamCardVisual } from '@/components/exam-card-visual';
import { IdCardVisual } from '@/components/id-card-visual';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';

export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Student | null>(null);
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, thisMonth: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  const templatesQuery = useMemoFirebase(() => db ? collection(db, 'templates') : null, [db]);
  const { data: templatesData } = useCollection<CardTemplate>(templatesQuery);
  const templates = templatesData || [];
  
  const examsQuery = useMemoFirebase(() => db ? collection(db, 'exams') : null, [db]);
  const { data: examsData } = useCollection<ExamEvent>(examsQuery);
  const exams = examsData || [];

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchSettings = async () => {
      if (!db) return;
      try {
        const docRef = doc(db, 'school_settings', 'default');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as SchoolSettings);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    fetchSettings();
  }, [db]);

  const handleSearch = async (queryStr: string = searchQuery) => {
    const q = (queryStr || '').trim();
    if (!q || !db) return;

    setIsSearching(true);
    setHasSearched(false);
    setSearchResult(null);
    
    const cleanQuery = q.replace('VERIFY-', '').trim();

    try {
      const qNis = query(collection(db, 'students'), where('nis', '==', cleanQuery));
      const qCode = query(collection(db, 'students'), where('card_code', '==', cleanQuery));
      const qNisn = query(collection(db, 'students'), where('nisn', '==', cleanQuery));
      
      const [snapNis, snapCode, snapNisn] = await Promise.all([
        getDocs(qNis), 
        getDocs(qCode),
        getDocs(qNisn)
      ]);
      
      const foundDoc = snapNis.docs[0] || snapCode.docs[0] || snapNisn.docs[0];

      if (foundDoc) {
        const student = { ...foundDoc.data(), id: foundDoc.id } as Student;
        setSearchResult(student);

        const logsQ = query(collection(db, 'attendance_logs'), where('student_id', '==', foundDoc.id), where('is_valid', '==', true));
        const logsSnap = await getDocs(logsQ);
        const logs = logsSnap.docs.map(d => d.data() as AttendanceLog);
        
        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        setAttendanceStats({
          total: logs.length,
          thisMonth: logs.filter(l => l.date?.startsWith(monthPrefix)).length
        });
      } else {
        toast({
          variant: "destructive",
          title: "Data Tidak Ditemukan",
          description: "Nomor induk (NIS/NISN) atau kode kartu tidak terdaftar di sistem kami."
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Terjadi kesalahan koneksi database." });
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', email.includes('admin') ? 'admin' : 'scanner');
      toast({ title: "Akses Berhasil", description: "Selamat datang kembali." });
      router.push('/mode-selection');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setLoginError('Kredensial salah. Pastikan email dan password yang Anda masukkan benar.');
      } else {
        setLoginError('Terjadi kendala keamanan: ' + err.message);
      }
      setIsLoggingIn(false);
    }
  };

  const startScanner = async () => {
    if (scannerRef.current) return;
    setIsScannerOpen(true);
    setHasCameraPermission(null);
    
    setTimeout(async () => {
      const element = document.getElementById("landing-reader");
      if (!element) return;

      try {
        const html5QrCode = new Html5Qrcode("landing-reader");
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setSearchQuery(decodedText);
            stopScanner();
            handleSearch(decodedText);
          },
          () => {}
        );
        setHasCameraPermission(true);
      } catch (err) {
        console.error("Scanner error:", err);
        setHasCameraPermission(false);
      }
    }, 300);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      scannerRef.current = null;
    }
    setIsScannerOpen(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleDownloadCard = async (type: 'STUDENT' | 'EXAM' | 'ID') => {
    if (!searchResult || !settings || !downloadRef.current) return;
    setIsDownloading(type);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const frontEl = downloadRef.current.querySelector('#card-front') as HTMLElement;
      const backEl = downloadRef.current.querySelector('#card-back') as HTMLElement;

      if (!frontEl || !backEl) throw new Error("Elements missing");

      const [cFront, cBack] = await Promise.all([
        html2canvas(frontEl, { scale: 3, useCORS: true }),
        html2canvas(backEl, { scale: 3, useCORS: true })
      ]);

      const isID = type === 'ID';
      const dims: [number, number] = isID ? [73, 111] : [85.6, 54];
      const pdf = new jsPDF({ orientation: isID ? 'portrait' : 'landscape', unit: 'mm', format: dims });
      
      pdf.addImage(cFront.toDataURL('image/png'), 'PNG', 0, 0, dims[0], dims[1]);
      pdf.addPage(dims, isID ? 'portrait' : 'landscape');
      pdf.addImage(cBack.toDataURL('image/png'), 'PNG', 0, 0, dims[0], dims[1]);
      
      pdf.save(`Kartu_${type}_${searchResult.name.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "Unduhan Berhasil", description: "File PDF telah tersimpan di perangkat Anda." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal Generate PDF", description: "Terjadi kesalahan render grafis." });
    } finally {
      setIsDownloading(null);
    }
  };

  if (!isMounted) return null;

  const activeStudentTemplate = templates.find(t => t.type === 'STUDENT_CARD' && t.is_active);
  const activeExamTemplate = templates.find(t => t.type === 'EXAM_CARD' && t.is_active);
  const activeIdTemplate = templates.find(t => t.type === 'ID_CARD' && t.is_active);
  const latestExam = exams.length > 0 ? exams[0] : undefined;

  const statsData = [
    { name: 'Sen', harian: 92, ujian: 85 },
    { name: 'Sel', harian: 95, ujian: 88 },
    { name: 'Rab', harian: 88, ujian: 92 },
    { name: 'Kam', harian: 94, ujian: 90 },
    { name: 'Jum', harian: 90, ujian: 82 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white font-body selection:bg-primary/20">
      <div className="fixed -left-[3000px] top-0 pointer-events-none" ref={downloadRef}>
        {searchResult && settings && isDownloading === 'STUDENT' && (
          <div className="flex flex-col gap-4">
            <div id="card-front"><StudentCardVisual student={searchResult} settings={settings} side="front" template={activeStudentTemplate} /></div>
            <div id="card-back"><StudentCardVisual student={searchResult} settings={settings} side="back" template={activeStudentTemplate} /></div>
          </div>
        )}
        {searchResult && settings && isDownloading === 'EXAM' && (
          <div className="flex flex-col gap-4">
            <div id="card-front"><ExamCardVisual student={searchResult} settings={settings} exam={latestExam} side="front" template={activeExamTemplate} /></div>
            <div id="card-back"><ExamCardVisual student={searchResult} settings={settings} exam={latestExam} side="back" template={activeExamTemplate} /></div>
          </div>
        )}
        {searchResult && settings && isDownloading === 'ID' && (
          <div className="flex flex-col gap-4">
            <div id="card-front"><IdCardVisual student={searchResult} settings={settings} side="front" template={activeIdTemplate} /></div>
            <div id="card-back"><IdCardVisual student={searchResult} settings={settings} side="back" template={activeIdTemplate} /></div>
          </div>
        )}
      </div>

      <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 bg-slate-50 rounded-xl p-2 shadow-sm border border-slate-100">
              <Image src="https://iili.io/KAqSZhb.png" alt="Logo" fill className="object-contain" priority unoptimized />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl text-primary leading-none tracking-tighter uppercase">EduCard Portal</span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1">SMKN 2 Tana Toraja</span>
            </div>
          </div>
          <Dialog onOpenChange={() => { setLoginError(''); }}>
            <DialogTrigger asChild>
              <Button size="lg" className="px-8 rounded-full shadow-xl shadow-primary/20 gap-2 font-black uppercase tracking-widest text-[10px] h-12">
                <LogIn className="h-4 w-4" /> Portal Akses
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
              <div className="bg-primary p-8 text-white text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                 <div className="w-16 h-16 bg-white rounded-2xl p-2 mx-auto mb-4 shadow-lg flex items-center justify-center relative">
                    <Image src="https://iili.io/KAqSZhb.png" alt="Logo" fill className="object-contain p-2" unoptimized />
                 </div>
                 <DialogTitle className="text-xl font-black uppercase tracking-tighter">Login Sistem</DialogTitle>
                 <DialogDescription className="text-white/70 font-bold text-[10px] uppercase tracking-widest">Manajemen Keamanan Terpadu</DialogDescription>
              </div>
              <div className="p-8 space-y-6">
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Akun</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="h-12 rounded-xl" />
                    </div>
                  </div>
                  {loginError && (
                    <Alert variant="destructive" className="py-2 px-3 rounded-xl border-none bg-red-50 text-red-600">
                      <AlertDescription className="text-[10px] font-bold leading-tight flex items-center gap-2">
                        <XCircle className="h-3 w-3" /> {loginError}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full h-12 text-xs font-black uppercase tracking-widest shadow-lg rounded-xl" disabled={isLoggingIn}>
                    {isLoggingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : 'MASUK KE SISTEM'}
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      <section className="pt-20 pb-16 bg-white">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter uppercase">Digital Identity<br/><span className="text-primary italic">Tracer Hub.</span></h1>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">Verifikasi identitas siswa, cek keabsahan kartu, dan pantau log kehadiran melalui portal resmi SMKN 2 Tana Toraja.</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100 shadow-2xl">
             <div className="flex items-center justify-between mb-8"><h4 className="font-black uppercase tracking-tighter text-slate-400">Statistik Aktivitas Kehadiran</h4><CalendarCheck className="h-5 w-5 text-primary opacity-30" /></div>
             <div className="h-[280px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Bar name="Sesi Harian" dataKey="harian" fill="#2E50B8" radius={[4,4,0,0]} barSize={24} />
                    <Bar name="Sesi Ujian" dataKey="ujian" fill="#f97316" radius={[4,4,0,0]} barSize={24} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="space-y-4">
               <h2 className="text-4xl font-black text-white tracking-tight uppercase">Identity Tracer System</h2>
               <p className="text-white/40 font-medium max-w-xl mx-auto">Verifikasi data siswa dan unduh kartu digital secara instan menggunakan NIS, NISN, atau pemindaian QR Code.</p>
            </div>
            <Card className="bg-white/5 border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-xl shadow-2xl">
              <CardContent className="p-10 space-y-10">
                <div className="flex flex-col md:flex-row gap-4 items-center max-w-3xl mx-auto">
                  <div className="flex-1 relative group w-full">
                    <Search className="absolute left-6 top-6 h-8 w-8 text-white/20 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Masukkan NIS / NISN / Kode..." 
                      className="pl-20 h-20 text-lg border-2 border-white/10 bg-white/5 text-white focus-visible:ring-primary rounded-[1.5rem] font-black uppercase"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={() => handleSearch()} className="h-20 px-8 font-black rounded-[1.5rem] text-[10px] tracking-widest shadow-2xl bg-primary" disabled={isSearching}>
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'CARI DATA'}
                    </Button>
                    <Button variant="outline" onClick={startScanner} className="h-20 w-20 flex flex-col items-center justify-center rounded-[1.5rem] border-white/10 bg-white/5 text-white hover:bg-white/10">
                      <QrCode className="h-6 w-6 mb-1" />
                      <span className="text-[7px] font-black uppercase tracking-tighter">SCAN</span>
                    </Button>
                  </div>
                </div>

                {hasSearched && searchResult ? (
                  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 flex flex-col items-stretch gap-8 text-left">
                      <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="w-48 h-64 bg-slate-100 rounded-3xl overflow-hidden relative shadow-2xl shrink-0 border-4 border-slate-50">
                          <Image src={searchResult.photo_url || 'https://picsum.photos/seed/placeholder/300/400'} alt="Siswa" fill className="object-cover" unoptimized />
                        </div>
                        <div className="flex-1 space-y-6">
                          <div className="flex items-center justify-between">
                              <Badge className="bg-emerald-500 text-white font-black uppercase text-[9px] tracking-[0.2em] px-4 py-1.5 rounded-full">Terverifikasi Firestore</Badge>
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{searchResult.card_code}</span>
                          </div>
                          <div>
                            <h3 className="text-5xl font-black text-slate-900 leading-none uppercase tracking-tighter">{searchResult.name}</h3>
                            <p className="text-primary font-black uppercase tracking-[0.3em] text-xs mt-3">{searchResult.class} - {searchResult.major}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                              <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">NIS / NISN</p><p className="text-base font-bold text-slate-800">{searchResult.nis} / {searchResult.nisn || '-'}</p></div>
                              <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Masa Berlaku</p><p className="text-base font-bold text-slate-800">{searchResult.valid_until}</p></div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center"><CalendarCheck className="h-6 w-6 text-primary" /></div>
                           <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Kehadiran</p><p className="text-2xl font-black text-primary">{attendanceStats.total} <span className="text-xs text-slate-400">kali</span></p></div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center"><Activity className="h-6 w-6 text-secondary" /></div>
                           <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bulan Ini</p><p className="text-2xl font-black text-secondary">{attendanceStats.thisMonth} <span className="text-xs text-slate-400">kali</span></p></div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button onClick={() => handleDownloadCard('STUDENT')} className="h-16 rounded-2xl gap-3 font-black text-[10px] tracking-widest bg-white/10 text-white" disabled={!!isDownloading}>
                        {isDownloading === 'STUDENT' ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5 text-primary" />} UNDUH KARTU PELAJAR
                      </Button>
                      <Button onClick={() => handleDownloadCard('EXAM')} className="h-16 rounded-2xl gap-3 font-black text-[10px] tracking-widest bg-white/10 text-white" disabled={!!isDownloading}>
                        {isDownloading === 'EXAM' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Award className="h-5 w-5 text-orange-500" />} UNDUH KARTU UJIAN
                      </Button>
                      <Button onClick={() => handleDownloadCard('ID')} className="h-16 rounded-2xl gap-3 font-black text-[10px] tracking-widest bg-white/10 text-white" disabled={!!isDownloading}>
                        {isDownloading === 'ID' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Contact className="h-5 w-5 text-emerald-500" />} UNDUH ID CARD UMUM
                      </Button>
                    </div>
                  </div>
                ) : hasSearched && !searchResult ? (
                   <div className="py-24 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center gap-4">
                      <XCircle className="h-12 w-12 text-white/20" />
                      <p className="text-white/20 font-black uppercase tracking-[0.5em] text-xl">Data Tidak Ditemukan</p>
                      <p className="text-white/10 text-xs">Pastikan nomor yang Anda masukkan benar (NIS/NISN/Kode)</p>
                   </div>
                ) : (
                  <div className="flex justify-center gap-16 opacity-10 py-10"><Users className="h-16 w-16 text-white" /><CreditCard className="h-16 w-16 text-white" /><ShieldCheck className="h-16 w-16 text-white" /></div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {isScannerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg relative space-y-6">
            <div className="flex justify-between items-center text-white">
              <div className="flex items-center gap-3"><QrCode className="h-6 w-6 text-primary" /><h3 className="font-black uppercase tracking-tighter text-xl">Scan Barcode Kartu</h3></div>
              <Button variant="ghost" size="icon" onClick={stopScanner} className="text-white hover:bg-white/10 rounded-full h-12 w-12"><X className="h-6 w-6" /></Button>
            </div>
            <div className="aspect-square w-full rounded-[3rem] border-4 border-dashed border-white/20 overflow-hidden relative bg-white/5 group">
              <div id="landing-reader" className="w-full h-full" />
              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-10 text-center gap-4">
                  <XCircle className="h-12 w-12 text-red-500" />
                  <p className="font-bold">Akses Kamera Ditolak</p>
                  <p className="text-xs opacity-60">Izinkan browser mengakses kamera Anda untuk memindai kartu.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white py-20 border-t">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-6">
             <div className="relative w-14 h-14 opacity-50"><Image src="https://iili.io/KAqSZhb.png" alt="L" fill className="object-contain" unoptimized /></div>
             <div className="text-left"><p className="text-sm font-black uppercase tracking-widest text-slate-900">EduCard Sync Tana Toraja</p><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 italic">Building a Smart & Digital Institution</p></div>
          </div>
        </div>
      </footer>
    </div>
  );
}