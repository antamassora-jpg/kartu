
"use client";

import { useState, useRef } from 'react';
import { Student } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Upload, 
  MoreVertical, 
  Edit, 
  Trash2,
  FileDown,
  Loader2,
  Calendar,
  Camera,
  Link as LinkIcon,
  User as UserIcon,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export default function StudentsPage() {
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    status: 'Aktif',
    valid_until: '2025-06-30',
    photo_url: '',
    nisn: ''
  });

  const studentsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'students'), orderBy('name', 'asc')) : null, 
    [db]
  );
  const { data: students = [], isLoading } = useCollection<Student>(studentsQuery);

  const classes = Array.from(new Set(students.map(s => s.class))).sort();
  const majors = Array.from(new Set(students.map(s => s.major))).sort();

  const filteredStudents = (students || []).filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                       s.nis.includes(search) || 
                       (s.nisn && s.nisn.includes(search));
    const matchClass = selectedClass === 'all' || s.class === selectedClass;
    const matchMajor = selectedMajor === 'all' || s.major === selectedMajor;
    return matchSearch && matchClass && matchMajor;
  });

  const handleAdd = () => {
    if (!newStudent.name || !newStudent.nis || !db) {
      toast({ title: "Gagal", description: "Nama dan NIS wajib diisi.", variant: "destructive" });
      return;
    }

    const studentData = {
      ...newStudent,
      card_code: `CC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    };

    addDoc(collection(db, 'students'), studentData)
      .then(() => {
        setIsAddOpen(false);
        setNewStudent({ status: 'Aktif', valid_until: '2025-06-30', photo_url: '', nisn: '' });
        toast({ title: "Berhasil", description: `Siswa ${studentData.name} berhasil ditambahkan.` });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'students',
          operation: 'create',
          requestResourceData: studentData
        }));
      });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'students', id))
      .then(() => {
        toast({ title: "Dihapus", description: "Data siswa berhasil dihapus." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `students/${id}`,
          operation: 'delete'
        }));
      });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewStudent({ ...newStudent, photo_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Memuat Database Siswa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Data Siswa</h1>
          <p className="text-muted-foreground">Kelola database master siswa secara real-time di Firestore.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Tambah Siswa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>Tambah Siswa Baru</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <div className="md:col-span-1 space-y-4">
                  <Label>Foto Siswa</Label>
                  <div className="aspect-[3/4] bg-muted rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group">
                    {newStudent.photo_url ? (
                      <Image src={newStudent.photo_url} alt="Preview" fill className="object-cover" />
                    ) : (
                      <UserIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  <Button variant="outline" size="sm" className="w-full" onClick={() => photoInputRef.current?.click()}>Upload Foto</Button>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input value={newStudent.name || ''} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>NIS</Label>
                    <Input value={newStudent.nis || ''} onChange={e => setNewStudent({...newStudent, nis: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kelas</Label>
                    <Input value={newStudent.class || ''} onChange={e => setNewStudent({...newStudent, class: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Jurusan</Label>
                    <Input value={newStudent.major || ''} onChange={e => setNewStudent({...newStudent, major: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun Ajaran</Label>
                    <Input value={newStudent.school_year || ''} onChange={e => setNewStudent({...newStudent, school_year: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAdd}>Simpan Data</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex-1 relative flex items-center">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3" />
          <Input 
            placeholder="Cari nama atau NIS..." 
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Kelas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedMajor} onValueChange={setSelectedMajor}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Jurusan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jurusan</SelectItem>
              {majors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Identitas</TableHead>
              <TableHead>NIS</TableHead>
              <TableHead>Kelas/Jurusan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 bg-slate-50 border rounded-full overflow-hidden shrink-0">
                      {student.photo_url ? (
                        <Image src={student.photo_url} alt={student.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><UserIcon className="h-5 w-5" /></div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">{student.name}</div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase">{student.card_code}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs font-bold">{student.nis}</TableCell>
                <TableCell>
                  <div className="font-medium">Kelas {student.class}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{student.major}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={student.status === 'Aktif' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(student.id)}>
                        <Trash2 className="h-4 w-4" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
