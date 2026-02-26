
"use client";

import { useState, useEffect } from 'react';
import { getDB } from '@/app/lib/db';
import { Student, SchoolSettings } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StudentCardVisual } from '@/components/student-card-visual';
import { 
  Printer, 
  Download, 
  Eye, 
  RefreshCw, 
  Search, 
  CheckSquare, 
  Square,
  Loader2,
  FileDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function CardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    const db = getDB();
    setStudents(db.students);
    setSettings(db.school_settings);
    if (db.students.length > 0) setPreviewId(db.students[0].id);
  }, []);

  const classes = Array.from(new Set(students.map(s => s.class)));
  const majors = Array.from(new Set(students.map(s => s.major)));

  const filteredStudents = students.filter(s => {
    const matchClass = selectedClass === 'all' || s.class === selectedClass;
    const matchMajor = selectedMajor === 'all' || s.major === selectedMajor;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery);
    return matchClass && matchMajor && matchSearch;
  });

  const previewStudent = students.find(s => s.id === previewId);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleDownloadSingle = async () => {
    if (!previewStudent) return;
    setIsProcessing(true);
    // Simulate generation delay
    await new Promise(r => setTimeout(r, 1500));
    setIsProcessing(false);
    toast({
      title: "Berhasil",
      description: `Kartu ${previewStudent.name} sedang diunduh sebagai PDF.`
    });
  };

  const handleBulkPrint = () => {
    if (selectedIds.size === 0) {
      toast({
        title: "Peringatan",
        description: "Pilih setidaknya satu siswa untuk dicetak.",
        variant: "destructive"
      });
      return;
    }
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Kartu Pelajar</h1>
          <p className="text-muted-foreground">Generate, kustomisasi, dan cetak kartu pelajar siswa secara massal.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button variant="outline" className="gap-2 shrink-0" onClick={() => {
            toast({ title: "Fitur segera hadir", description: "Export data CSV sedang dalam pengembangan." });
          }}>
            <FileDown className="h-4 w-4" /> Export CSV
          </Button>
          <Button className="gap-2 shrink-0" onClick={handleBulkPrint}>
            <Printer className="h-4 w-4" /> Cetak Massal ({selectedIds.size})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Filter & Navigasi</CardTitle>
            <CardDescription>Cari dan pilih siswa untuk diproses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama atau NIS..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Kelas</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Jurusan</label>
                <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {majors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Daftar Siswa ({filteredStudents.length})</label>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={toggleSelectAll}>
                  {selectedIds.size === filteredStudents.length ? 'Batal Semua' : 'Pilih Semua'}
                </Button>
              </div>
              <div className="max-h-[350px] overflow-y-auto border rounded-md divide-y bg-muted/20">
                {filteredStudents.length > 0 ? filteredStudents.map(s => (
                  <div 
                    key={s.id} 
                    className={`p-3 text-sm cursor-pointer hover:bg-white flex items-center justify-between group transition-colors ${previewId === s.id ? 'bg-white border-l-4 border-primary' : ''}`}
                    onClick={() => setPreviewId(s.id)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="shrink-0" onClick={(e) => toggleSelect(s.id, e)}>
                        {selectedIds.has(s.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold truncate">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground">{s.nis} • {s.major}</div>
                      </div>
                    </div>
                    <Eye className={`h-4 w-4 shrink-0 transition-opacity ${previewId === s.id ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                )) : (
                  <div className="p-10 text-center text-xs text-muted-foreground italic">Siswa tidak ditemukan</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              Pratinjau Kartu Pelajar
              <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" onClick={() => {
                toast({ title: "Berhasil", description: "Data pratinjau diperbarui." });
              }}>
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
            </CardTitle>
            <CardDescription>Tampilan kartu saat dicetak sesuai pengaturan sekolah.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-10 py-10 bg-muted/5 rounded-b-lg">
            {previewStudent && settings ? (
              <>
                <div className="space-y-4 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground bg-white px-4 py-1 rounded-full border shadow-sm">Tampak Depan</span>
                  <div className="shadow-2xl hover:scale-[1.02] transition-transform duration-300">
                    <StudentCardVisual student={previewStudent} settings={settings} side="front" />
                  </div>
                </div>
                <div className="space-y-4 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground bg-white px-4 py-1 rounded-full border shadow-sm">Tampak Belakang</span>
                  <div className="shadow-2xl hover:scale-[1.02] transition-transform duration-300">
                    <StudentCardVisual student={previewStudent} settings={settings} side="back" />
                  </div>
                </div>
                <div className="w-full flex flex-col sm:flex-row justify-center gap-3 mt-4 border-t pt-8 px-6">
                   <Button variant="outline" className="flex-1 gap-2 h-11" onClick={handleDownloadSingle} disabled={isProcessing}>
                     {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                     Download PDF
                   </Button>
                   <Button className="flex-1 gap-2 h-11" onClick={() => setIsPrintModalOpen(true)}>
                     <Printer className="h-4 w-4" /> Cetak Sekarang
                   </Button>
                </div>
              </>
            ) : (
              <div className="py-20 flex flex-col items-center gap-4 text-muted-foreground italic">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center animate-pulse">
                  <Eye className="h-8 w-8 opacity-20" />
                </div>
                Pilih siswa untuk melihat pratinjau kartu
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Cetak Massal */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Siap untuk Mencetak</DialogTitle>
            <DialogDescription>
              Menyiapkan {selectedIds.size || 1} kartu untuk proses pencetakan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-y my-4 bg-muted/10 p-4 rounded-lg">
             {/* Mocking the print layout */}
             {Array.from(selectedIds).slice(0, 4).map(id => {
               const s = students.find(x => x.id === id);
               return s && settings ? (
                 <div key={id} className="scale-75 origin-top-left border shadow-sm rounded-xl overflow-hidden mb-[-50px]">
                   <StudentCardVisual student={s} settings={settings} side="front" />
                 </div>
               ) : null;
             })}
             {selectedIds.size > 4 && (
               <div className="col-span-full text-center py-4 text-xs font-bold text-muted-foreground">
                 + {selectedIds.size - 4} Kartu lainnya...
               </div>
             )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 text-xs text-muted-foreground mb-4 sm:mb-0">
               <p>Tips: Pastikan printer menggunakan kertas ID Card PVC atau Art Paper 260gsm.</p>
            </div>
            <Button variant="ghost" onClick={() => setIsPrintModalOpen(false)}>Batal</Button>
            <Button className="gap-2" onClick={() => {
              setIsPrintModalOpen(false);
              toast({ title: "Berhasil", description: "Mengirim data ke printer..." });
            }}>
              <Printer className="h-4 w-4" /> Konfirmasi Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
