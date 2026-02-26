"use client";

import { useState, useEffect, useRef } from 'react';
import { getDB, saveDB } from '@/app/lib/db';
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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
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
    photo_url: ''
  });

  useEffect(() => {
    setStudents(getDB().students);
  }, []);

  const classes = Array.from(new Set(students.map(s => s.class))).sort();
  const majors = Array.from(new Set(students.map(s => s.major))).sort();

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search);
    const matchClass = selectedClass === 'all' || s.class === selectedClass;
    const matchMajor = selectedMajor === 'all' || s.major === selectedMajor;
    return matchSearch && matchClass && matchMajor;
  });

  const handleAdd = () => {
    if (!newStudent.name || !newStudent.nis) {
      toast({ title: "Gagal", description: "Nama dan NIS wajib diisi.", variant: "destructive" });
      return;
    }

    const db = getDB();
    const student: Student = {
      ...newStudent as Student,
      id: Math.random().toString(36).substr(2, 9),
      card_code: `CC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    };
    const updated = [...db.students, student];
    db.students = updated;
    saveDB(db);
    setStudents(updated);
    setIsAddOpen(false);
    setNewStudent({ status: 'Aktif', valid_until: '2025-06-30', photo_url: '' });
    toast({ title: "Berhasil", description: `Siswa ${student.name} berhasil ditambahkan.` });
  };

  const handleDelete = (id: string) => {
    const db = getDB();
    const updated = db.students.filter(s => s.id !== id);
    db.students = updated;
    saveDB(db);
    setStudents(updated);
    toast({ title: "Dihapus", description: "Data siswa berhasil dihapus." });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewStudent({ ...newStudent, photo_url: reader.result as string });
      toast({ title: "Foto Terpilih", description: "Foto berhasil dimuat dari penyimpanan lokal." });
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadFormat = () => {
    const headers = "name;nis;nisn;class;major;school_year;status;valid_until;photo_url";
    const sampleData = "Andi Pratama;2021001;0051234567;XII;Teknik Komputer & Jaringan;2024/2025;Aktif;2025-06-30;https://picsum.photos/seed/student1/300/400";
    const csvContent = `${headers}\n${sampleData}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "format_import_siswa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Format Diunduh", description: "Gunakan titik koma (;) sebagai pemisah kolom." });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(';').map(h => h.trim());
        
        const db = getDB();
        const newStudentsList: Student[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(';').map(v => v.trim());
          const entry: any = {};
          
          headers.forEach((header, index) => {
            entry[header] = values[index];
          });

          if (entry.name && entry.nis) {
            newStudentsList.push({
              id: Math.random().toString(36).substr(2, 9),
              name: entry.name,
              nis: entry.nis,
              nisn: entry.nisn || '',
              class: entry.class || '-',
              major: entry.major || '-',
              school_year: entry.school_year || '2024/2025',
              status: (entry.status as any) || 'Aktif',
              valid_until: entry.valid_until || '2025-06-30',
              card_code: `CC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
              photo_url: entry.photo_url || `https://picsum.photos/seed/${entry.nis}/300/400`
            });
          }
        }

        const updated = [...db.students, ...newStudentsList];
        db.students = updated;
        saveDB(db);
        setStudents(updated);
        toast({ title: "Import Berhasil", description: `${newStudentsList.length} data siswa telah ditambahkan.` });
      } catch (error) {
        toast({ variant: "destructive", title: "Import Gagal", description: "Pastikan format CSV benar." });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Data Siswa</h1>
          <p className="text-muted-foreground">Kelola database master siswa dan verifikasi kartu.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
          <Button variant="outline" className="gap-2" onClick={handleDownloadFormat}>
            <FileDown className="h-4 w-4" /> Format CSV (;)
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleImportClick} disabled={isImporting}>
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import Data
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Siswa Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Tambah Siswa Baru</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <div className="md:col-span-1 space-y-4">
                  <Label>Foto Siswa</Label>
                  <div className="aspect-[3/4] bg-muted rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group">
                    {newStudent.photo_url ? (
                      <>
                        <Image src={newStudent.photo_url} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Button variant="secondary" size="sm" onClick={() => setNewStudent({...newStudent, photo_url: ''})}>Hapus</Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <UserIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Belum Ada Foto</p>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="gap-2 w-full" onClick={() => photoInputRef.current?.click()}>
                      <Camera className="h-3.5 w-3.5" /> Upload File
                    </Button>
                    <div className="relative">
                      <LinkIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input 
                        placeholder="Link URL Foto" 
                        className="pl-8 text-xs h-9"
                        value={newStudent.photo_url || ''}
                        onChange={(e) => setNewStudent({...newStudent, photo_url: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Nama Lengkap</Label>
                    <Input 
                      value={newStudent.name || ''} 
                      onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                      placeholder="Nama Lengkap"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NIS</Label>
                    <Input 
                      value={newStudent.nis || ''} 
                      onChange={e => setNewStudent({...newStudent, nis: e.target.value})}
                      placeholder="NIS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NISN</Label>
                    <Input 
                      value={newStudent.nisn || ''} 
                      onChange={e => setNewStudent({...newStudent, nisn: e.target.value})}
                      placeholder="NISN"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kelas</Label>
                    <Input 
                      value={newStudent.class || ''} 
                      onChange={e => setNewStudent({...newStudent, class: e.target.value})}
                      placeholder="Kelas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jurusan</Label>
                    <Input 
                      value={newStudent.major || ''} 
                      onChange={e => setNewStudent({...newStudent, major: e.target.value})}
                      placeholder="Jurusan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun Ajaran</Label>
                    <Input 
                      value={newStudent.school_year || ''} 
                      onChange={e => setNewStudent({...newStudent, school_year: e.target.value})}
                      placeholder="2024/2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Berlaku Sampai</Label>
                    <Input 
                      type="date"
                      value={newStudent.valid_until || ''} 
                      onChange={e => setNewStudent({...newStudent, valid_until: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd} className="w-full md:w-auto">Simpan Data Siswa</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex-1 relative flex items-center">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3" />
          <Input 
            placeholder="Cari nama atau NIS..." 
            className="pl-9 bg-muted/20 border-none shadow-none focus-visible:ring-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 min-w-[300px]">
          <div className="flex-1 flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>Kelas {c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={selectedMajor} onValueChange={setSelectedMajor}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Semua Jurusan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jurusan</SelectItem>
                {majors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Identitas</TableHead>
              <TableHead>NIS</TableHead>
              <TableHead>Kelas/Jurusan</TableHead>
              <TableHead>Masa Berlaku</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>QR Code</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 bg-slate-50 border rounded-full overflow-hidden shadow-inner shrink-0 border-white ring-2 ring-slate-100">
                      {student.photo_url ? (
                        <Image src={student.photo_url} alt={student.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <UserIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">{student.name}</div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                        {student.card_code}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{student.nis}</TableCell>
                <TableCell>
                  <div className="font-medium">Kelas {student.class}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{student.major}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {student.valid_until}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={student.status === 'Aktif' ? 'default' : 'secondary'} className="text-[10px] uppercase px-3">
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="relative w-12 h-12 bg-white border rounded p-1 shadow-inner group hover:scale-[2.5] transition-transform origin-center z-20 cursor-zoom-in">
                    <Image 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFY-${student.card_code}`}
                      alt="QR Code" fill className="object-contain" unoptimized
                    />
                  </div>
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
                      <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(student.id)}>
                        <Trash2 className="h-4 w-4" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">
                  Data tidak ditemukan. Silahkan tambah siswa baru atau import CSV.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}