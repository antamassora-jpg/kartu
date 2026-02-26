
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
  Calendar
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
import { toast } from '@/hooks/use-toast';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    status: 'Aktif',
    valid_until: '2025-06-30'
  });

  useEffect(() => {
    setStudents(getDB().students);
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.nis.includes(search)
  );

  const handleAdd = () => {
    if (!newStudent.name || !newStudent.nis) {
      toast({ title: "Gagal", description: "Nama dan NIS wajib diisi.", variant: "destructive" });
      return;
    }

    const db = getDB();
    // Barcode / Card Code otomatis dibuat di sini
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
    setNewStudent({ status: 'Aktif', valid_until: '2025-06-30' });
    toast({ title: "Berhasil", description: `Siswa ${student.name} berhasil ditambahkan dengan kode kartu otomatis.` });
  };

  const handleDelete = (id: string) => {
    const db = getDB();
    const updated = db.students.filter(s => s.id !== id);
    db.students = updated;
    saveDB(db);
    setStudents(updated);
    toast({ title: "Dihapus", description: "Data siswa berhasil dihapus." });
  };

  const handleDownloadFormat = () => {
    const headers = "name;nis;nisn;class;major;school_year;status;valid_until";
    const sampleData = "Andi Pratama;2021001;0051234567;XII;Teknik Komputer & Jaringan;2024/2025;Aktif;2025-06-30";
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
        const newStudents: Student[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(';').map(v => v.trim());
          const entry: any = {};
          
          headers.forEach((header, index) => {
            entry[header] = values[index];
          });

          if (entry.name && entry.nis) {
            newStudents.push({
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
              photo_url: `https://picsum.photos/seed/${entry.nis}/300/400`
            });
          }
        }

        const updated = [...db.students, ...newStudents];
        db.students = updated;
        saveDB(db);
        setStudents(updated);
        toast({ 
          title: "Import Berhasil", 
          description: `${newStudents.length} data siswa baru telah ditambahkan.` 
        });
      } catch (error) {
        toast({ 
          variant: "destructive", 
          title: "Import Gagal", 
          description: "Pastikan menggunakan format titik koma (;) dan kolom yang benar." 
        });
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
          <p className="text-muted-foreground">Kelola data master siswa SMKN 2 Tana Toraja.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Siswa Baru</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nama Lengkap</Label>
                  <Input 
                    value={newStudent.name || ''} 
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <Label>NIS</Label>
                  <Input 
                    value={newStudent.nis || ''} 
                    onChange={e => setNewStudent({...newStudent, nis: e.target.value})}
                    placeholder="Contoh: 2021001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>NISN</Label>
                  <Input 
                    value={newStudent.nisn || ''} 
                    onChange={e => setNewStudent({...newStudent, nisn: e.target.value})}
                    placeholder="10 digit nomor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <Input 
                    value={newStudent.class || ''} 
                    onChange={e => setNewStudent({...newStudent, class: e.target.value})}
                    placeholder="Contoh: XII"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jurusan</Label>
                  <Input 
                    value={newStudent.major || ''} 
                    onChange={e => setNewStudent({...newStudent, major: e.target.value})}
                    placeholder="Nama Jurusan"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tahun Ajaran</Label>
                  <Input 
                    value={newStudent.school_year || ''} 
                    onChange={e => setNewStudent({...newStudent, school_year: e.target.value})}
                    placeholder="Contoh: 2024/2025"
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
              <DialogFooter>
                <Button onClick={handleAdd}>Simpan Data</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Cari nama atau NIS..." 
          className="border-none shadow-none focus-visible:ring-0"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Nama Siswa</TableHead>
              <TableHead>NIS</TableHead>
              <TableHead>Kelas/Jurusan</TableHead>
              <TableHead>Masa Berlaku</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-[10px] text-muted-foreground">ID: {student.card_code}</div>
                </TableCell>
                <TableCell>{student.nis}</TableCell>
                <TableCell>
                  <div>{student.class}</div>
                  <div className="text-xs text-muted-foreground">{student.major}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {student.valid_until}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={student.status === 'Aktif' ? 'default' : 'secondary'}>
                    {student.status}
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
                      <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(student.id)}>
                        <Trash2 className="h-4 w-4" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
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
