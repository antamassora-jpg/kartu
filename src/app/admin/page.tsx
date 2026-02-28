
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarCheck, CreditCard, Award, Loader2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Student, AttendanceLog, ExamEvent } from '@/app/lib/types';

export default function AdminDashboard() {
  const db = useFirestore();
  
  // Memoize Firestore references to prevent infinite re-renders
  const studentsQuery = useMemoFirebase(() => 
    db ? collection(db, 'students') : null, 
    [db]
  );
  const { data: studentsData, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);
  const students = studentsData || [];

  const logsQuery = useMemoFirebase(() => 
    db ? collection(db, 'attendance_logs') : null, 
    [db]
  );
  const { data: logsData, isLoading: loadingLogs } = useCollection<AttendanceLog>(logsQuery);
  const logs = logsData || [];

  const examsQuery = useMemoFirebase(() => 
    db ? collection(db, 'exams') : null, 
    [db]
  );
  const { data: examsData } = useCollection<ExamEvent>(examsQuery);
  const exams = examsData || [];

  // Derived stats calculated using useMemo to avoid state-update loops
  const stats = useMemo(() => ({
    totalStudents: students.length,
    totalLogs: logs.length,
    activeExams: exams.length,
    activeCards: students.filter((s: Student) => s.status === 'Aktif').length
  }), [students, logs, exams]);

  // Derived major distribution for the pie chart
  const majorData = useMemo(() => {
    if (students.length === 0) return [];
    
    const counts = students.reduce((acc: Record<string, number>, s: Student) => {
      const major = s.major || 'Lainnya';
      acc[major] = (acc[major] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    }));
  }, [students]);

  const barData = [
    { name: 'Sen', hadir: Math.round(stats.totalStudents * 0.9) || 0, absen: Math.round(stats.totalStudents * 0.1) || 0 },
    { name: 'Sel', hadir: Math.round(stats.totalStudents * 0.95) || 0, absen: Math.round(stats.totalStudents * 0.05) || 0 },
    { name: 'Rab', hadir: Math.round(stats.totalStudents * 0.92) || 0, absen: Math.round(stats.totalStudents * 0.08) || 0 },
    { name: 'Kam', hadir: Math.round(stats.totalStudents * 0.94) || 0, absen: Math.round(stats.totalStudents * 0.06) || 0 },
    { name: 'Jum', hadir: Math.round(stats.totalStudents * 0.88) || 0, absen: Math.round(stats.totalStudents * 0.12) || 0 },
  ];

  const COLORS = ['#2E50B8', '#4FBFDD', '#FFBB28', '#FF8042', '#10B981', '#F43F5E', '#8B5CF6'];

  if (loadingStudents || loadingLogs) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Menghubungkan ke Database Real-time...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Dashboard Overview</h1>
          <p className="text-muted-foreground">Data real-time SMKN 2 Tana Toraja dari Cloud Firestore.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Siswa" value={stats.totalStudents} icon={Users} color="bg-blue-500" />
        <StatCard title="Total Absensi" value={stats.totalLogs} icon={CalendarCheck} color="bg-green-500" />
        <StatCard title="Kartu Aktif" value={stats.activeCards} icon={CreditCard} color="bg-orange-500" />
        <StatCard title="Event Ujian" value={stats.activeExams} icon={Award} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Kehadiran Pekan Ini (Estimasi)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="hadir" name="Hadir" fill="#2E50B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absen" name="Absen" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Distribusi Siswa per Jurusan</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col items-center justify-center">
            {majorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={majorData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {majorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" align="center" layout="horizontal" iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground italic h-full">
                <Users className="h-12 w-12 opacity-10 mb-2" />
                <span>Belum ada data siswa</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black mt-1 text-slate-900">{value}</h3>
          </div>
          <div className={`p-4 rounded-2xl text-white shadow-lg ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
