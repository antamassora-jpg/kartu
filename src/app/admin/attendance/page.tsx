"use client";

import { useState, useEffect } from 'react';
import { getDB } from '@/app/lib/db';
import { AttendanceLog, Student } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Sparkles, Download, FileText, Calendar } from 'lucide-react';
import { analyzeAttendance } from '@/ai/flows/analyze-attendance-flow';
import { toast } from '@/hooks/use-toast';

export default function AttendanceAdminPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  useEffect(() => {
    const db = getDB();
    setLogs(db.logs);
    setStudents(db.students);
  }, []);

  const handleAiAnalysis = async () => {
    if (logs.length === 0) {
      toast({ title: "Data kosong", description: "Belum ada data absensi untuk dianalisis." });
      return;
    }

    setIsAnalyzing(true);
    try {
      const records = logs.map(l => {
        const student = students.find(s => s.id === l.student_id);
        return {
          studentId: l.student_id,
          studentName: student?.name || 'Unknown',
          nis: student?.nis || 'Unknown',
          date: l.date,
          sessionName: 'Masuk',
          status: l.is_valid ? 'Present' : 'Absent' as any,
          isLate: false
        };
      });

      const result = await analyzeAttendance({
        className: "Semua Kelas",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        attendanceRecords: records
      });
      setAiResult(result);
    } catch (err) {
      toast({ title: "Gagal analisis", description: "Terjadi kesalahan saat memproses data." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Rekap Absensi</h1>
          <p className="text-muted-foreground">Pantau kehadiran siswa secara real-time.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={handleAiAnalysis} disabled={isAnalyzing}>
            <Sparkles className="h-4 w-4" /> {isAnalyzing ? 'Menganalisis...' : 'AI Analisis Tren'}
          </Button>
        </div>
      </div>

      {aiResult && (
        <Card className="border-secondary bg-secondary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" />
              <CardTitle className="text-lg">AI Attendance Analysis</CardTitle>
            </div>
            <CardDescription>{aiResult.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">Laju Kehadiran</div>
                <div className="text-2xl font-bold text-primary">{aiResult.overallStats.averageAttendanceRate}%</div>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">Total Absen</div>
                <div className="text-2xl font-bold text-destructive">{aiResult.overallStats.totalAbsences}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">Keterlambatan</div>
                <div className="text-2xl font-bold text-orange-500">{aiResult.overallStats.totalLateArrivals}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Wawasan Utama:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {aiResult.patternsIdentified.map((p: string, i: number) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Log Absensi Terkini</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? logs.slice(0, 10).map(log => {
                  const s = students.find(x => x.id === log.student_id);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{new Date(log.scanned_at).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        <div className="font-medium">{s?.name || 'Siswa'}</div>
                        <div className="text-[10px] text-muted-foreground">{s?.class} - {s?.major}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.is_valid ? 'default' : 'destructive'} className="text-[10px]">
                          {log.is_valid ? 'Hadir' : 'Invalid'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">Belum ada data scan.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistik Harian</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={[{name: 'Hadir', count: logs.filter(l => l.is_valid).length}, {name: 'Absen', count: 5}]}>
                 <XAxis dataKey="name" />
                 <YAxis />
                 <Tooltip />
                 <Bar dataKey="count" fill="#4FBFDD" />
               </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
