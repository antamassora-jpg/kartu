
"use client";

import { useState } from 'react';
import { ExamEvent } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar, FileText, MoreVertical, Trash2, Edit, AlertCircle, Loader2 } from 'lucide-react';
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
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export default function ExamsPage() {
  const db = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newExam, setNewExam] = useState<Partial<ExamEvent>>({
    semester: 'Ganjil',
    school_year: '2024/2025'
  });

  const examsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'exams'), orderBy('start_date', 'desc')) : null, 
    [db]
  );
  const { data: exams = [], isLoading } = useCollection<ExamEvent>(examsQuery);

  const handleAdd = () => {
    if (!newExam.name || !newExam.start_date || !db) {
      toast({ title: "Gagal", description: "Nama dan tanggal ujian harus diisi.", variant: "destructive" });
      return;
    }

    addDoc(collection(db, 'exams'), newExam)
      .then(() => {
        setIsAddOpen(false);
        setNewExam({ semester: 'Ganjil', school_year: '2024/2025' });
        toast({ title: "Berhasil", description: "Event ujian baru telah ditambahkan." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'exams',
          operation: 'create',
          requestResourceData: newExam
        }));
      });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'exams', id))
      .then(() => {
        toast({ title: "Dihapus", description: "Event ujian telah dihapus." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `exams/${id}`,
          operation: 'delete'
        }));
      });
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Memuat Daftar Ujian...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Manajemen Ujian</h1>
          <p className="text-muted-foreground">Kelola jadwal dan verifikasi kartu ujian di Cloud Firestore.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Tambah Event Ujian</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Buat Event Ujian Baru</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama Ujian</Label>
                <Input value={newExam.name || ''} onChange={e => setNewExam({...newExam, name: e.target.value})} placeholder="PAS Ganjil" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tahun Ajaran</Label>
                  <Input value={newExam.school_year || ''} onChange={e => setNewExam({...newExam, school_year: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input value={newExam.semester || ''} onChange={e => setNewExam({...newExam, semester: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mulai</Label>
                  <Input type="date" value={newExam.start_date || ''} onChange={e => setNewExam({...newExam, start_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Selesai</Label>
                  <Input type="date" value={newExam.end_date || ''} onChange={e => setNewExam({...newExam, end_date: e.target.value})} />
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAdd}>Simpan Event</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Event Ujian Terdaftar</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Ujian</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(exams || []).map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <div className="font-semibold text-primary">{exam.name}</div>
                    <div className="text-[10px] text-muted-foreground">{exam.school_year} ({exam.semester})</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {exam.start_date} - {exam.end_date}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">Real-time</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(exam.id)}>
                          <Trash2 className="h-4 w-4" /> Hapus
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
    </div>
  );
}
