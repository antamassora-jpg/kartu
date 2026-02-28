
"use client";

import { useMemo, useState, useRef } from 'react';
import { Student, AttendanceLog, ExamEvent, SchoolSettings, CardTemplate } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Users, 
  Calendar, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Search, 
  Download, 
  MoreVertical,
  User as UserIcon,
  CreditCard,
  Award,
  Contact
} from 'lucide-react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StudentCardVisual } from '@/components/student-card-visual';
import { ExamCardVisual } from '@/components/exam-card-visual';
import { IdCardVisual } from '@/components/id-card-visual';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function LogDatabasePage() {
  const db = useFirestore();
  const [studentSearch, setStudentSearch] = useState('');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [downloadStudent, setDownloadStudent] = useState<Student | null>(null);

  // Data Loading
  const studentsQuery = useMemoFirebase(() => db ? collection(db, 'students') : null, [db]);
  const { data: studentsData, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);
  const students = studentsData || [];

  const logsQuery = useMemoFirebase(() => db ? query(collection(db, 'attendance_logs'), orderBy('scanned_at', 'desc'), limit(100)) : null, [db]);
  const { data: logsData, isLoading: loadingLogs } = useCollection<AttendanceLog>(logsQuery);
  const logs = logsData || [];

  const examsQuery = useMemoFirebase(() => db ? collection(db, 'exams') : null, [db]);
  const { data: examsData } = useCollection<ExamEvent>(examsQuery);
  const exams = examsData || [];

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'school_settings', 'default') : null, [db]);
  const { data: settings } = useDoc<SchoolSettings>(settingsRef);

  const templatesQuery = useMemoFirebase(() => db ? collection(db, 'templates') : null, [db]);
  const { data: templates } = useCollection<CardTemplate>(templatesQuery);

  const activeStudentTemplate = templates?.find(t => t.type === 'STUDENT_CARD' && t.is_active);
  const activeExamTemplate = templates?.find(t => t.type === 'EXAM_CARD' && t.is_active);
  const activeIdTemplate = templates?.find(t => t.type === 'ID_CARD' && t.is_active);

  const dailyLogs = useMemo(() => logs.filter(l => l.session_id !== 'exam'), [logs]);
  const examLogs = useMemo(() => logs.filter(l => l.session_id === 'exam'), [logs]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
      s.nis.includes(studentSearch) || 
      (s.nisn && s.nisn.includes(studentSearch))
    );
  }, [students, studentSearch]);

  const handleDownloadCard = async (student: Student, type: 'STUDENT' | 'EXAM' | 'ID') => {
    if (!settings || !downloadRef.current) return;
    
    setDownloadStudent(student);
    setIsDownloading(`${student.id}-${type}`);
    
    toast({ title: "Menyiapkan File", description: `Sedang memproses ${type.replace('_', ' ')}...` });

    try {
      // Tunggu render visual
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const frontEl = downloadRef.current.querySelector('#card-front') as HTMLElement;
      const backEl = downloadRef.current.querySelector('#card-back') as HTMLElement;

      if (!frontEl || !backEl) throw new Error("Gagal merender komponen visual.");

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
      
      pdf.save(`Kartu_${type}_${student.name.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "Berhasil", description: "File kartu telah diunduh." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Gagal Mengunduh", description: "Terjadi kesalahan render." });
    } finally {
      setIsDownloading(null);
      setDownloadStudent(null);
    }
  };

  if (loadingStudents || loadingLogs) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Menghubungkan ke Cloud Firestore...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hidden Download Engine */}
      <div className="fixed -left-[3000px] top-0 pointer-events-none" ref={downloadRef}>
        {downloadStudent && settings && isDownloading?.includes('STUDENT') && (
          <>
            <div id="card-front"><StudentCardVisual student={downloadStudent} settings={settings} side="front" template={activeStudentTemplate} /></div>
            <div id="card-back"><StudentCardVisual student={downloadStudent} settings={settings} side="back" template={activeStudentTemplate} /></div>
          </>
        )}
        {downloadStudent && settings && isDownloading?.includes('EXAM') && (
          <>
            <div id="card-front"><ExamCardVisual student={downloadStudent} settings={settings} exam={exams[0]} side="front" template={activeExamTemplate} /></div>
            <div id="card-back"><ExamCardVisual student={downloadStudent} settings={settings} exam={exams[0]} side="back" template={activeExamTemplate} /></div>
          </>
        )}
        {downloadStudent && settings && isDownloading?.includes('ID') && (
          <>
            <div id="card-front"><IdCardVisual student={downloadStudent} settings={settings} side="front" template={activeIdTemplate} /></div>
            <div id="card-back"><IdCardVisual student={downloadStudent} settings={settings} side="back" template={activeIdTemplate} /></div>
          </>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
            <Database className="h-8 w-8" /> Log Database
          </h1>
          <p className="text-muted-foreground">Monitoring aktivitas sistem dan integritas data kartu secara real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10 rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Total Siswa Aktif</p>
                <h3 className="text-2xl font-black text-primary">{students.filter(s => s.status === 'Aktif').length}</h3>
              </div>
              <Users className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100 rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Log Harian (Terbaru)</p>
                <h3 className="text-2xl font-black text-emerald-600">{dailyLogs.length}</h3>
              </div>
              <Clock className="h-8 w-8 text-emerald-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100 rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Log Ujian (Terbaru)</p>
                <h3 className="text-2xl font-black text-orange-600">{examLogs.length}</h3>
              </div>
              <GraduationCap className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="students" className="gap-2 rounded-lg data-[state=active]:bg-white">
            <Users className="h-4 w-4" /> Siswa & Kartu
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2 rounded-lg data-[state=active]:bg-white">
            <Calendar className="h-4 w-4" /> Absensi Harian
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-2 rounded-lg data-[state=active]:bg-white">
            <GraduationCap className="h-4 w-4" /> Absensi Ujian
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-6">
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Data Master Siswa</CardTitle>
                  <CardDescription>Status kartu dan kode verifikasi di dalam database.</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                  <Input 
                    placeholder="Cari Nama / NIS / NISN..." 
                    className="pl-9 h-10 rounded-xl"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="px-6 font-black uppercase text-[10px]">Nama Siswa</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">NIS</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Kode Kartu</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Kelas/Jurusan</TableHead>
                    <TableHead className="px-6 font-black uppercase text-[10px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s) => (
                    <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={s.photo_url} className="object-cover" />
                            <AvatarFallback><UserIcon className="h-5 w-5 text-slate-300" /></AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-slate-800">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 uppercase tracking-tighter">
                          {s.card_code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'Aktif' ? 'default' : 'secondary'} className="text-[10px] bg-[#2E50B8]">
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-500 font-medium">
                        {s.class} - {s.major}
                      </TableCell>
                      <TableCell className="px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100 min-w-[180px]">
                            <div className="px-2 py-1.5 text-[10px] font-black uppercase text-slate-400 border-b mb-1 tracking-widest">Download Kartu</div>
                            <DropdownMenuItem className="gap-2 font-bold text-xs" onSelect={() => handleDownloadCard(s, 'STUDENT')}>
                              <CreditCard className="h-4 w-4 text-blue-500" /> Kartu Pelajar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 font-bold text-xs" onSelect={() => handleDownloadCard(s, 'EXAM')}>
                              <Award className="h-4 w-4 text-orange-500" /> Kartu Ujian
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 font-bold text-xs" onSelect={() => handleDownloadCard(s, 'ID')}>
                              <Contact className="h-4 w-4 text-emerald-500" /> ID Card Umum
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="mt-6">
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Log Absensi Harian</CardTitle>
              <CardDescription>Catatan pemindaian kartu untuk sesi masuk dan pulang.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="px-6 py-4 font-black uppercase text-[10px]">Waktu Scan</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Siswa</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Sesi</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                    <TableHead className="px-6 font-black uppercase text-[10px]">Petugas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyLogs.length > 0 ? dailyLogs.map((log) => {
                    const s = students.find(x => x.id === log.student_id);
                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-6 py-4 text-[11px]">
                          <div className="font-bold">{log.date}</div>
                          <div className="text-muted-foreground">{new Date(log.scanned_at).toLocaleTimeString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-800">{s?.name || 'Unknown'}</div>
                          <div className="text-[10px] text-muted-foreground">{log.card_code}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest px-2">
                            {log.session_id === 's1' ? 'Masuk' : 'Pulang'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {log.is_valid ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className={cn("text-[10px] font-black tracking-widest", log.is_valid ? 'text-emerald-600' : 'text-red-600')}>
                              {log.is_valid ? 'VALID' : 'INVALID'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{log.scanned_by_user_id}</TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-24 text-muted-foreground italic font-medium">Belum ada log absensi harian.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="mt-6">
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Log Absensi Ujian</CardTitle>
              <CardDescription>Catatan kehadiran siswa pada event-event ujian terjadwal.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="px-6 py-4 font-black uppercase text-[10px]">Waktu Scan</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Siswa</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Nama Ujian</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                    <TableHead className="px-6 font-black uppercase text-[10px]">Kode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examLogs.length > 0 ? examLogs.map((log) => {
                    const s = students.find(x => x.id === log.student_id);
                    const exam = exams.find(e => e.id === log.exam_id);
                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-6 py-4 text-[11px]">
                          <div className="font-bold">{log.date}</div>
                          <div className="text-muted-foreground">{new Date(log.scanned_at).toLocaleTimeString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-800">{s?.name || 'Unknown'}</div>
                          <div className="text-[10px] text-muted-foreground">{s?.nis}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-orange-600 text-xs uppercase tracking-tight">{exam?.name || 'Ujian'}</div>
                          <div className="text-[9px] text-muted-foreground font-medium">{exam?.school_year}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-[9px] font-black tracking-widest", log.is_valid ? 'bg-orange-500' : 'bg-destructive')}>
                            {log.is_valid ? 'HADIR' : 'GAGAL'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 text-[10px] text-slate-400 font-mono uppercase tracking-tighter">
                          {log.card_code}
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-24 text-muted-foreground italic font-medium">Belum ada log absensi ujian.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
