"use client";

import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/app/lib/db';
import { ExamEvent } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar, FileText, MoreVertical, Trash2, Edit, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamEvent[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newExam, setNewExam] = useState<Partial<ExamEvent>>({
    semester: 'Ganjil',
    school_year: '2024/2025'
  });

  useEffect(() => {
    setExams(getDB().exams);
  }, []);

  const handleAdd = () => {
    if (!newExam.name || !newExam.start_date) {
      toast({ title: "Gagal", description: "Nama dan tanggal ujian harus diisi.", variant: "destructive" });
      return;
    }
    const db = getDB();
    const exam: ExamEvent = {
      ...newExam as ExamEvent,
      id: Math.random().toString(36).substr(2, 9)
    };
    const updated = [...db.exams, exam];
    db.exams = updated;
    saveDB(db);
    setExams(updated);
    setIsAddOpen(false);
    setNewExam({ semester: 'Ganjil', school_year: '2024/2025' });
    toast({ title: "Berhasil", description: "Event ujian baru telah ditambahkan." });
  };

  const handleDelete = (id: string) => {
    const db = getDB();
    const updated = db.exams.filter(e => e.id !== id);
    db.exams = updated;
    saveDB(db);
    setExams(updated);
    toast({ title: "Dihapus", description: "Event ujian telah dihapus." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Manajemen Ujian</h1>
          <p className="text-muted-foreground">Kelola jadwal dan verifikasi kartu ujian siswa.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Event Ujian
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Event Ujian Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama Ujian (Contoh: PAS Ganjil)</Label>
                <Input 
                  value={newExam.name || ''} 
                  onChange={e => setNewExam({...newExam, name: e.target.value})}
                  placeholder="Nama Ujian"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tahun Ajaran</Label>
                  <Input 
                    value={newExam.school_year || ''} 
                    onChange={e => setNewExam({...newExam, school_year: e.target.value})}
                    placeholder="2024/2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input 
                    value={newExam.semester || ''} 
                    onChange={e => setNewExam({...newExam, semester: e.target.value})}
                    placeholder="Ganjil/Genap"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input 
                    type="date"
                    value={newExam.start_date || ''} 
                    onChange={e => setNewExam({...newExam, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Selesai</Label>
                  <Input 
                    type="date"
                    value={newExam.end_date || ''} 
                    onChange={e => setNewExam({...newExam, end_date: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd}>Simpan Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Ujian Terdaftar</CardTitle>
          <CardDescription>Daftar semua pelaksanaan ujian di sekolah.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Ujian</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Tahun / Sem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length > 0 ? exams.map((exam) => {
                const isUpcoming = new Date(exam.start_date) > new Date();
                const isOngoing = new Date(exam.start_date) <= new Date() && new Date(exam.end_date) >= new Date();
                
                return (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div className="font-semibold text-primary">{exam.name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Event ID: {exam.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {exam.start_date} - {exam.end_date}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {exam.school_year} ({exam.semester})
                    </TableCell>
                    <TableCell>
                      <Badge variant={isOngoing ? 'default' : isUpcoming ? 'secondary' : 'outline'} className="text-[10px]">
                        {isOngoing ? 'Berjalan' : isUpcoming ? 'Mendatang' : 'Selesai'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(exam.id)}>
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 opacity-20" />
                      Belum ada event ujian yang dijadwalkan.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
