
"use client";

import { useMemo } from 'react';
import { Student, AttendanceLog, ExamEvent } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Database, Users, Calendar, GraduationCap, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function LogDatabasePage() {
  const db = useFirestore();

  const studentsQuery = useMemoFirebase(() => db ? collection(db, 'students') : null, [db]);
  const { data: studentsData, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);
  const students = studentsData || [];

  const logsQuery = useMemoFirebase(() => db ? query(collection(db, 'attendance_logs'), orderBy('scanned_at', 'desc'), limit(100)) : null, [db]);
  const { data: logsData, isLoading: loadingLogs } = useCollection<AttendanceLog>(logsQuery);
  const logs = logsData || [];

  const examsQuery = useMemoFirebase(() => db ? collection(db, 'exams') : null, [db]);
  const { data: examsData } = useCollection<ExamEvent>(examsQuery);
  const exams = examsData || [];

  const dailyLogs = useMemo(() => logs.filter(l => l.session_id !== 'exam'), [logs]);
  const examLogs = useMemo(() => logs.filter(l => l.session_id === 'exam'), [logs]);

  if (loadingStudents || loadingLogs) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Menghubungkan ke Cloud Firestore...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
            <Database className="h-8 w-8" /> Log Database
          </h1>
          <p className="text-muted-foreground">Monitoring aktivitas sistem dan integritas data kartu secara real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10">
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
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Log Harian (100 Terakhir)</p>
                <h3 className="text-2xl font-black text-emerald-600">{dailyLogs.length}</h3>
              </div>
              <Clock className="h-8 w-8 text-emerald-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Log Ujian (100 Terakhir)</p>
                <h3 className="text-2xl font-black text-orange-600">{examLogs.length}</h3>
              </div>
              <GraduationCap className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" /> Siswa & Kartu
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2">
            <Calendar className="h-4 w-4" /> Absensi Harian
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-2">
            <GraduationCap className="h-4 w-4" /> Absensi Ujian
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Master Siswa</CardTitle>
              <CardDescription>Status kartu dan kode verifikasi di dalam database.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Kode Kartu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kelas/Jurusan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 uppercase tracking-tighter">
                          {s.card_code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'Aktif' ? 'default' : 'secondary'} className="text-[10px]">
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.class} - {s.major}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Log Absensi Harian</CardTitle>
              <CardDescription>Catatan pemindaian kartu untuk sesi masuk dan pulang.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu Scan</TableHead>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Sesi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Petugas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyLogs.length > 0 ? dailyLogs.map((log) => {
                    const s = students.find(x => x.id === log.student_id);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-[11px]">
                          <div className="font-bold">{log.date}</div>
                          <div className="text-muted-foreground">{new Date(log.scanned_at).toLocaleTimeString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">{s?.name || 'Unknown'}</div>
                          <div className="text-[10px] text-muted-foreground">{log.card_code}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] uppercase">
                            {log.session_id === 's1' ? 'Masuk' : 'Pulang'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {log.is_valid ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className="text-[10px] font-bold">{log.is_valid ? 'VALID' : 'INVALID'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]">{log.scanned_by_user_id}</TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">Belum ada log absensi harian.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Log Absensi Ujian</CardTitle>
              <CardDescription>Catatan kehadiran siswa pada event-event ujian terjadwal.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu Scan</TableHead>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Nama Ujian</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examLogs.length > 0 ? examLogs.map((log) => {
                    const s = students.find(x => x.id === log.student_id);
                    const exam = exams.find(e => e.id === log.exam_id);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-[11px]">
                          <div className="font-bold">{log.date}</div>
                          <div className="text-muted-foreground">{new Date(log.scanned_at).toLocaleTimeString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">{s?.name || 'Unknown'}</div>
                          <div className="text-[10px] text-muted-foreground">{s?.nis}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-orange-600 text-xs uppercase">{exam?.name || 'Ujian'}</div>
                          <div className="text-[9px] text-muted-foreground">{exam?.school_year}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.is_valid ? 'default' : 'destructive'} className="text-[9px]">
                            {log.is_valid ? 'HADIR' : 'GAGAL'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground font-mono uppercase">
                          {log.card_code}
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">Belum ada log absensi ujian.</TableCell>
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
