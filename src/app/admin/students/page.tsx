
"use client";

import { useState, useRef, useMemo } from 'react';
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
  FileSpreadsheet,
  Loader2,
  Calendar,
  Filter,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, query, orderBy, updateDoc, writeBatch } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function StudentsPage() {
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [editingStudent, setEditStudent] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  // States for Import
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importData, setImportData] = useState<Partial<Student>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '',
    nis: '',
    nisn: '',
    class: '',
    major: '',
    school_year: '2024/2025',
    status: 'Aktif',
    valid_until: '2030-06-30',
    photo_url: '',
  });

  const studentsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'students'), orderBy('name', 'asc')) : null, 
    [db]
  );
  const { data: studentsData, isLoading } = useCollection<Student>(studentsQuery);
  const students = studentsData || [];

  const classes = useMemo(() => Array.from(new Set(students.map(s => s.class))).filter(Boolean).sort(), [students]);
  const majors = useMemo(() => Array.from(new Set(students.map(s => s.major))).filter(Boolean).sort(), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = (s.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
                         (s.nis || '').includes(search) || 
                         (s.nisn && s.nisn.includes(search));
      const matchClass = selectedClass === 'all' || s.class === selectedClass;
      const matchMajor = selectedMajor === 'all' || s.major === selectedMajor;
      return matchSearch && matchClass && matchMajor;
    });
  }, [students, search, selectedClass, selectedMajor]);

  const handleAdd = async () => {
    if (!newStudent.name || !newStudent.nis || !db) {
      toast({ title: "Gagal", description: "Nama dan NIS wajib diisi.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (editingStudent) {
        // Clean data: remove ID before updating
        const { id, ...dataToUpdate } = newStudent as any;
        await updateDoc(doc(db, 'students', editingStudent.id), dataToUpdate);
        toast({ title: "Berhasil", description: `Data ${newStudent.name} diperbarui.` });
      } else {
        const studentData = {
          ...newStudent,
          card_code: `CC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        };
        await addDoc(collection(db, 'students'), studentData);
        toast({ title: "Berhasil", description: `Siswa ${studentData.name} ditambahkan.` });
      }
      setIsAddOpen(false);
      setEditStudent(null);
      setNewStudent({ name: '', nis: '', nisn: '', class: '', major: '', school_year: '2024/2025', status: 'Aktif', valid_until: '2030-06-30', photo_url: '' });
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: editingStudent ? `students/${editingStudent.id}` : 'students',
        operation: editingStudent ? 'update' : 'create',
        requestResourceData: newStudent
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (s: Student) => {
    setEditStudent(s);
    setNewStudent({ ...s });
    setIsAddOpen(true);
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

  const handleDeleteAll = async () => {
    if (!db || students.length === 0) return;
    setIsDeletingAll(true);
    const batch = writeBatch(db);
    
    try {
      students.forEach((s) => {
        batch.delete(doc(db, 'students', s.id));
      });
      await batch.commit();
      toast({ title: "Berhasil", description: "Seluruh data siswa telah dihapus." });
      setIsDeleteAllOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan saat menghapus data massal." });
    } finally {
      setIsDeletingAll(false);
    }
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

  const handleDownloadTemplate = () => {
    const headers = "name;nis;nisn;class;major;school_year;status;valid_until";
    const sample = "Andi Pratama;2021001;0051234567;XII;TEKNIK KOMPUTER & JARINGAN;2023/2024;Aktif;2030-06-30";
    const csvContent = `${headers}\n${sample}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_siswa.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const results: Partial<Student>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(';');
        if (cols.length >= 2) {
          results.push({
            name: cols[0],
            nis: cols[1],
            nisn: cols[2] || '',
            class: cols[3] || 'X',
            major: cols[4] || 'UMUM',
            school_year: cols[5] || '2024/2025',
            status: (cols[6] as any) || 'Aktif',
            valid_until: cols[7] || '2030-06-30',
            card_code: `CC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
          });
        }
      }
      
      setImportData(results);
      setIsImportPreviewOpen(true);
      if (csvInputRef.current) csvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const processImport = async () => {
    if (!db || importData.length === 0) return;
    setIsImporting(true);
    let successCount = 0;

    try {
      for (const student of importData) {
        await addDoc(collection(db, 'students'), student);
        successCount++;
      }
      toast({ title: "Import Berhasil", description: `${successCount} data siswa telah ditambahkan.` });
      setIsImportPreviewOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Import Gagal", description: "Terjadi kesalahan saat menyimpan data." });
    } finally {
      setIsImporting(false);
      setImportData([]);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Menghubungkan ke Database Cloud...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline text-[#2E50B8] tracking-tight">Data Siswa</h1>
          <p className="text-muted-foreground mt-1 font-medium">Kelola database master siswa dan verifikasi kartu.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" className="gap-2 bg-slate-50 border-slate-200 text-slate-600 font-bold rounded-xl h-11" onClick={handleDownloadTemplate}>
            <FileSpreadsheet className="h-4 w-4" /> Format CSV (;)
          </Button>
          <Button variant="outline" className="gap-2 bg-slate-50 border-slate-200 text-slate-600 font-bold rounded-xl h-11" onClick={() => csvInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import Data
          </Button>
          <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
          <Button variant="destructive" className="gap-2 font-bold rounded-xl h-11 px-6 shadow-lg shadow-red-500/10" onClick={() => setIsDeleteAllOpen(true)} disabled={students.length === 0}>
            <Trash2 className="h-4 w-4" /> Hapus Semua
          </Button>
          <Button className="gap-2 bg-[#2E50B8] hover:bg-[#1e3a8a] text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-blue-500/20" onClick={() => { setEditStudent(null); setNewStudent({ name: '', nis: '', nisn: '', class: '', major: '', school_year: '2024/2025', status: 'Aktif', valid_until: '2030-06-30', photo_url: '' }); setIsAddOpen(true); }}>
            <Plus className="h-4 w-4" /> Siswa Baru
          </Button>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#2E50B8] transition-colors" />
          <Input 
            placeholder="Cari nama, NIS, atau NISN..." 
            className="pl-12 h-12 bg-slate-50/50 border-none rounded-[1rem] font-medium focus-visible:ring-1 focus-visible:ring-slate-200"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Filter className="h-4 w-4 text-slate-300" />
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-40 h-12 bg-slate-50/50 border-none rounded-[1rem] font-bold text-slate-600">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {classes.map(c => <SelectItem key={c} value={c}>Kelas {c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedMajor} onValueChange={setSelectedMajor}>
            <SelectTrigger className="w-56 h-12 bg-slate-50/50 border-none rounded-[1rem] font-bold text-slate-600">
              <SelectValue placeholder="Semua Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jurusan</SelectItem>
              {majors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-[1.5rem] border border-slate-100 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-5 px-6 font-black uppercase text-[10px] text-slate-400 tracking-widest">Identitas</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">NIS / NISN</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Kelas/Jurusan</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Masa Berlaku</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest">Status</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] text-slate-400 tracking-widest text-center">QR Code</TableHead>
              <TableHead className="py-5 px-6 font-black uppercase text-[10px] text-slate-400 tracking-widest text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
              <TableRow key={student.id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-50">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={student.photo_url} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 text-slate-400"><UserIcon className="h-6 w-6" /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 leading-tight text-sm">{student.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{student.card_code}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 text-sm">{student.nis}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{student.nisn || '-'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 text-sm">Kelas {student.class}</span>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter leading-tight mt-0.5">{student.major}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                    <Calendar className="h-3.5 w-3.5 text-slate-300" />
                    {student.valid_until}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-[#2E50B8] hover:bg-[#2E50B8] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="inline-block p-1 bg-white border rounded-md shadow-xs">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=40x40&data=VERIFY-${student.card_code}`}
                      alt="QR" 
                      className="w-8 h-8 opacity-80"
                    />
                  </div>
                </TableCell>
                <TableCell className="px-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#2E50B8] hover:bg-blue-50 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl min-w-[120px]">
                      <DropdownMenuItem className="gap-2 font-bold text-slate-600 focus:text-[#2E50B8] cursor-pointer" onSelect={() => handleEdit(student)}>
                        <Edit className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 font-bold text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer" onSelect={() => handleDelete(student.id)}>
                        <Trash2 className="h-4 w-4" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-24">
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <UserIcon className="h-12 w-12" />
                    <p className="text-sm font-black uppercase tracking-widest">Tidak ada data ditemukan</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) setEditStudent(null); }}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#2E50B8] p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</DialogTitle>
              <p className="text-white/60 font-medium text-sm">Lengkapi formulir di bawah untuk memperbarui database master.</p>
            </DialogHeader>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Foto Profil</Label>
              <div className="aspect-[3/4] bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                {newStudent.photo_url ? (
                  <Image src={newStudent.photo_url} alt="Preview" fill className="object-cover" unoptimized />
                ) : (
                  <UserIcon className="h-16 w-16 text-slate-200" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => photoInputRef.current?.click()}>
                  <Upload className="text-white h-8 w-8" />
                </div>
              </div>
              <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full rounded-xl font-bold border-slate-200" onClick={() => photoInputRef.current?.click()}>Unggah Gambar</Button>
                
                {newStudent.photo_url && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold text-[10px] uppercase"
                    onClick={() => setNewStudent({...newStudent, photo_url: ''})}
                  >
                    <Trash2 className="h-3 w-3 mr-2" /> Hapus Foto
                  </Button>
                )}

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Atau Link URL Foto</Label>
                  <div className="relative group">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300 group-focus-within:text-primary" />
                    <Input 
                      value={newStudent.photo_url || ''} 
                      onChange={e => setNewStudent({...newStudent, photo_url: e.target.value})} 
                      className="h-10 pl-9 rounded-xl bg-slate-50 border-none text-xs font-medium" 
                      placeholder="https://..." 
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nama Lengkap</Label>
                <Input value={newStudent.name || ''} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-700" placeholder="Contoh: Andi Pratama" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">NIS</Label>
                <Input value={newStudent.nis || ''} onChange={e => setNewStudent({...newStudent, nis: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">NISN (Opsional)</Label>
                <Input value={newStudent.nisn || ''} onChange={e => setNewStudent({...newStudent, nisn: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Kelas</Label>
                <Input value={newStudent.class || ''} onChange={e => setNewStudent({...newStudent, class: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-700" placeholder="XII" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Jurusan</Label>
                <Input value={newStudent.major || ''} onChange={e => setNewStudent({...newStudent, major: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-700" placeholder="TKJ" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</Label>
                <Select value={newStudent.status} onValueChange={(val: any) => setNewStudent({...newStudent, status: val})}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                    <SelectItem value="Lulus">Lulus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Berlaku Sampai</Label>
                <Input type="date" value={newStudent.valid_until || ''} onChange={e => setNewStudent({...newStudent, valid_until: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-700" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex gap-3">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="font-bold rounded-xl h-12 px-8">Batal</Button>
            <Button onClick={handleAdd} className="bg-[#2E50B8] hover:bg-[#1e3a8a] text-white font-black uppercase tracking-widest h-12 px-12 rounded-xl shadow-lg shadow-blue-500/20" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              SIMPAN DATA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE ALL CONFIRMATION */}
      <Dialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <Trash2 className="h-10 w-10" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Hapus Semua Siswa?</DialogTitle>
              <DialogDescription className="font-medium text-slate-500">
                Tindakan ini akan menghapus permanen <strong>{students.length}</strong> data siswa dari database Cloud Firestore. Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 w-full pt-4">
              <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeletingAll} className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px]">
                {isDeletingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                IYA, HAPUS SEMUANYA
              </Button>
              <Button variant="ghost" onClick={() => setIsDeleteAllOpen(false)} disabled={isDeletingAll} className="h-12 rounded-xl font-bold text-slate-400">
                BATALKAN
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* IMPORT PREVIEW DIALOG */}
      <Dialog open={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen}>
        <DialogContent className="max-w-4xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-emerald-600 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <Upload className="h-6 w-6" /> Pratinjau Import Data
              </DialogTitle>
              <DialogDescription className="text-white/70 font-medium">
                Ditemukan {importData.length} data siswa. Silakan tinjau sebelum disimpan ke database.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-0 max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase">Nama</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">NIS</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Kelas/Jurusan</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Thn Ajaran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.map((s, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-bold text-sm">{s.name}</TableCell>
                    <TableCell className="text-xs font-mono">{s.nis}</TableCell>
                    <TableCell className="text-xs">{s.class} - {s.major}</TableCell>
                    <TableCell className="text-xs">{s.school_year}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase">
              <AlertCircle className="h-4 w-4" />
              Pastikan format tanggal (YYYY-MM-DD) sudah benar.
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setIsImportPreviewOpen(false)} disabled={isImporting} className="font-bold rounded-xl h-12 px-8">Batal</Button>
              <Button onClick={processImport} disabled={isImporting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest h-12 px-12 rounded-xl shadow-lg shadow-emerald-500/20 gap-2">
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                KONFIRMASI IMPORT ({importData.length})
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
