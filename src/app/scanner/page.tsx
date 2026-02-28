
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, CheckCircle2, XCircle, Clock, History, ChevronsLeftRight, GraduationCap, Calendar, Loader2, Camera, CameraOff } from 'lucide-react';
import { Student, AttendanceLog, ExamEvent } from '@/app/lib/types';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useAuth } from '@/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export default function ScannerPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useAuth();
  
  const [attendanceType, setAttendanceType] = useState<'harian' | 'ujian'>('harian');
  const [selectedSession, setSelectedSession] = useState('s1');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [lastScan, setLastScan] = useState<{ status: 'valid' | 'invalid' | 'duplicate', student?: Student, reason?: string } | null>(null);
  
  // Real-time collections
  const { data: students = [] } = useCollection(db ? collection(db, 'students') : null);
  const { data: exams = [] } = useCollection(db ? collection(db, 'exam_events') : null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: todayLogs = [] } = useCollection(
    db ? query(
      collection(db, 'attendance_logs'),
      where('date', '==', todayStr),
      orderBy('scanned_at', 'desc'),
      limit(10)
    ) : null
  );

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0].id);
    }
  }, [exams]);

  const startScanner = async () => {
    if (attendanceType === 'ujian' && !selectedExamId) {
      toast({ variant: "destructive", title: "Pilih Ujian", description: "Silakan pilih event ujian terlebih dahulu." });
      return;
    }

    try {
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }

      setIsScanning(true);
      setLastScan(null);
      
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = { fps: 15, qrbox: { width: 250, height: 250 } };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleProcessScan(decodedText);
        },
        () => {}
      );
      setHasCameraPermission(true);
    } catch (err) {
      setHasCameraPermission(false);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleProcessScan = async (decodedText: string) => {
    const cleanCode = decodedText.replace('VERIFY-', '').trim();
    const student = students.find((s: any) => s.card_code === cleanCode || s.nis === cleanCode);
    
    if (!student) {
      setLastScan({ status: 'invalid', reason: 'Kode Tidak Terdaftar' });
      return;
    }

    const sessionId = attendanceType === 'ujian' ? 'exam' : selectedSession;
    
    // Cek duplikat di Firestore (perlu fetch real-time atau cek dari todayLogs lokal)
    const isDuplicate = todayLogs.some((l: any) => 
      l.student_id === student.id && 
      l.session_id === sessionId &&
      (attendanceType === 'ujian' ? l.exam_id === selectedExamId : true)
    );
    
    if (isDuplicate) {
      setLastScan({ status: 'duplicate', student, reason: 'Sudah absen sebelumnya' });
      return;
    }

    const isValid = student.status === 'Aktif';
    
    const newLog = {
      student_id: student.id,
      card_code: student.card_code,
      date: todayStr,
      session_id: sessionId,
      exam_id: attendanceType === 'ujian' ? selectedExamId : null,
      scanned_at: new Date().toISOString(),
      scanned_by_user_id: user?.email || 'petugas',
      is_valid: isValid,
      reason: isValid ? null : 'Kartu Tidak Aktif'
    };

    // Tulis ke Firestore
    if (db) {
      addDoc(collection(db, 'attendance_logs'), newLog);
    }
    
    setLastScan({ 
      status: isValid ? 'valid' : 'invalid', 
      student, 
      reason: isValid ? undefined : 'Status Nonaktif' 
    });

    if (isValid) {
      toast({ title: "Absensi Berhasil", description: `${student.name} berhasil tercatat.` });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 relative">
                <Image src="https://iili.io/KAqSZhb.png" alt="Logo" fill className="object-contain" unoptimized />
             </div>
             <div>
                <h1 className="text-lg font-bold text-primary font-headline">Scanner Real-time</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Firestore Sync Aktif</p>
             </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/mode-selection')} className="gap-2 text-muted-foreground hover:text-primary">
            <ChevronsLeftRight className="h-4 w-4" /> Role
          </Button>
        </div>

        <Card className={cn("overflow-hidden border-none shadow-xl transition-all", attendanceType === 'harian' ? 'ring-2 ring-primary/20' : 'ring-2 ring-orange-500/20')}>
          <div className={cn("h-2", attendanceType === 'harian' ? 'bg-primary' : 'bg-orange-500')}></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Kontrol Pemindaian</CardTitle>
            <CardDescription>Sinkronisasi data absensi langsung ke Cloud Firestore.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Jenis Absensi</Label>
                <Select value={attendanceType} onValueChange={(val: any) => { setAttendanceType(val); if (isScanning) stopScanner(); }}>
                  <SelectTrigger className="w-full h-11 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="harian">Absensi Harian</SelectItem>
                    <SelectItem value="ujian">Absensi Ujian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {attendanceType === 'harian' ? (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sesi Hari Ini</Label>
                  <Select value={selectedSession} onValueChange={setSelectedSession}>
                    <SelectTrigger className="w-full h-11 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s1">Pagi (Masuk)</SelectItem>
                      <SelectItem value="s2">Sore (Pulang)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Event Ujian</Label>
                  <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                    <SelectTrigger className="w-full h-11 bg-slate-50 border-none font-bold"><SelectValue placeholder="Pilih Ujian" /></SelectTrigger>
                    <SelectContent>
                      {exams.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="relative">
              <div className={cn("aspect-square w-full max-w-[320px] mx-auto rounded-3xl border-4 transition-all overflow-hidden bg-slate-50 relative", isScanning ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]" : "border-dashed border-slate-200")}>
                <div id="reader" className="w-full h-full" />
                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6 bg-slate-50 z-10 pointer-events-none">
                    <div className={cn("p-6 rounded-full", attendanceType === 'ujian' ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary')}><Camera className="h-12 w-12" /></div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">Kamera Belum Aktif</p>
                  </div>
                )}
              </div>
            </div>

            {lastScan && (
              <div className={cn("p-4 rounded-2xl flex items-center gap-4 border-2 animate-in fade-in slide-in-from-bottom-4 duration-500", lastScan.status === 'valid' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : lastScan.status === 'duplicate' ? 'bg-orange-50 border-orange-100 text-orange-800' : 'bg-red-50 border-red-100 text-red-800')}>
                <div className="w-14 h-18 relative rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0 border-2 border-white">
                   {lastScan.student?.photo_url ? <Image src={lastScan.student.photo_url} alt="F" fill className="object-cover" unoptimized /> : <div className="w-full h-full bg-slate-100" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    {lastScan.status === 'valid' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                    <span className="font-black text-[9px] uppercase tracking-widest">{lastScan.status.toUpperCase()}</span>
                  </div>
                  <div className="font-black truncate text-base uppercase">{lastScan.student?.name || 'Data Tidak Dikenal'}</div>
                  <div className="text-[10px] font-bold opacity-70">{lastScan.reason}</div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-slate-50 p-6">
            {!isScanning ? (
              <Button className={cn("w-full h-14 text-lg font-black uppercase tracking-widest gap-3 shadow-lg", attendanceType === 'ujian' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-primary')} onClick={startScanner}><Camera className="h-6 w-6" /> AKTIFKAN SCANNER</Button>
            ) : (
              <Button variant="destructive" className="w-full h-14 text-lg font-black uppercase tracking-widest gap-3 shadow-lg" onClick={stopScanner}><Loader2 className="h-6 w-6 animate-spin" /> MATIKAN SCANNER</Button>
            )}
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <h3 className="font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2 text-slate-500 px-2"><History className="h-4 w-4" /> Riwayat Real-time (Firestore)</h3>
          <div className="space-y-2">
            {todayLogs.map((log: any) => {
              const s = students.find((x: any) => x.id === log.student_id);
              return (
                <div key={log.id} className={cn("bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm", log.session_id === 'exam' ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-primary')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border-2 overflow-hidden relative">
                       {s?.photo_url ? <Image src={s.photo_url} alt="X" fill className="object-cover" unoptimized /> : <span className="p-2">{s?.name.charAt(0)}</span>}
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase leading-none mb-1">{s?.name || 'Siswa'}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-3 font-bold">
                        <Clock className="h-3 w-3" /> {new Date(log.scanned_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                  <Badge variant={log.is_valid ? 'default' : 'destructive'} className="text-[9px] font-black">{log.is_valid ? 'HADIR' : 'GAGAL'}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `#reader video { border-radius: 1.5rem !important; object-fit: cover !important; }` }} />
    </div>
  );
}
