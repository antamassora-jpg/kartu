
"use client";

import { useState, useRef } from 'react';
import { Student, SchoolSettings, CardTemplate } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentCardVisual } from '@/components/student-card-visual';
import { 
  Printer, 
  Download, 
  Eye, 
  Search, 
  CheckSquare, 
  Square,
  Loader2,
  Users,
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
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';

export default function CardsPage() {
  const db = useFirestore();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  const cardRefFront = useRef<HTMLDivElement>(null);
  const cardRefBack = useRef<HTMLDivElement>(null);
  const bulkContainerRef = useRef<HTMLDivElement>(null);

  const studentsQuery = useMemoFirebase(() => db ? query(collection(db, 'students'), orderBy('name', 'asc')) : null, [db]);
  const { data: studentsData, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);
  const students = studentsData || [];

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'school_settings', 'default') : null, [db]);
  const { data: settings } = useDoc<SchoolSettings>(settingsRef);

  const templatesQuery = useMemoFirebase(() => db ? collection(db, 'templates') : null, [db]);
  const { data: templates } = useCollection<CardTemplate>(templatesQuery);
  const activeTemplate = templates?.find(t => t.type === 'STUDENT_CARD' && t.is_active) || null;

  const classes = Array.from(new Set(students.map(s => s.class))).sort();
  const majors = Array.from(new Set(students.map(s => s.major))).sort();

  const filteredStudents = students.filter(s => {
    const matchClass = selectedClass === 'all' || s.class === selectedClass;
    const matchMajor = selectedMajor === 'all' || s.major === selectedMajor;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       s.nis.includes(searchQuery) || 
                       (s.nisn && s.nisn.includes(searchQuery));
    return matchClass && matchMajor && matchSearch;
  });

  const previewStudent = students.find(s => s.id === previewId) || (students.length > 0 ? students[0] : null);

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

  const captureElement = async (el: HTMLElement) => {
    return await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
  };

  const handleDownloadSingle = async () => {
    if (!previewStudent || !cardRefFront.current || !cardRefBack.current) return;
    setIsProcessing(true);
    
    try {
      const canvasFront = await captureElement(cardRefFront.current);
      const canvasBack = await captureElement(cardRefBack.current);

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });
      pdf.addImage(canvasFront.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 85.6, 54);
      pdf.addPage([85.6, 54], 'landscape');
      pdf.addImage(canvasBack.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 85.6, 54);
      pdf.save(`Kartu_Pelajar_${previewStudent.name.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "Berhasil", description: "Kartu telah diunduh." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal membuat PDF." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadBulk = async () => {
    if (selectedIds.size === 0 || !bulkContainerRef.current) return;
    setIsBulkDownloading(true);
    
    toast({ title: "Memulai Proses", description: `Menyiapkan ${selectedIds.size} kartu...` });

    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });
      const cardElements = Array.from(bulkContainerRef.current.querySelectorAll('.page-break'));
      
      for (let i = 0; i < cardElements.length; i++) {
        const set = cardElements[i] as HTMLElement;
        const front = set.querySelector('.visual-front') as HTMLElement;
        const back = set.querySelector('.visual-back') as HTMLElement;

        if (!front || !back) continue;

        if (i > 0) pdf.addPage([85.6, 54], 'landscape');
        
        const canvasFront = await captureElement(front);
        pdf.addImage(canvasFront.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 85.6, 54);
        
        pdf.addPage([85.6, 54], 'landscape');
        const canvasBack = await captureElement(back);
        pdf.addImage(canvasBack.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 85.6, 54);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      pdf.save(`Bulk_Kartu_Pelajar_${new Date().getTime()}.pdf`);
      toast({ title: "Berhasil", description: "Dokumen PDF massal telah diunduh." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan render massal." });
    } finally {
      setIsBulkDownloading(false);
    }
  };

  if (loadingStudents) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Memuat Template & Siswa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div id="print-area" ref={bulkContainerRef}>
        {Array.from(selectedIds).map(id => {
          const s = students.find(x => x.id === id);
          return s && settings ? (
            <div key={id} className="page-break">
              <div className="print-card-gap visual-front">
                <StudentCardVisual student={s} settings={settings} side="front" template={activeTemplate} />
              </div>
              <div className="visual-back">
                <StudentCardVisual student={s} settings={settings} side="back" template={activeTemplate} />
              </div>
            </div>
          ) : null;
        })}
      </div>

      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Kartu Pelajar</h1>
          <p className="text-muted-foreground">Generate dan cetak kartu pelajar siswa secara massal dari Cloud Firestore.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 shadow-sm border-2" onClick={handleDownloadBulk} disabled={selectedIds.size === 0 || isBulkDownloading}>
            {isBulkDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Unduh PDF Massal ({selectedIds.size})
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setIsPrintModalOpen(true)} disabled={selectedIds.size === 0}>
            <Printer className="h-4 w-4" /> Cetak Massal ({selectedIds.size})
          </Button>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Daftar Siswa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama, NIS..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger size="sm"><SelectValue placeholder="Kelas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                <SelectTrigger size="sm"><SelectValue placeholder="Jurusan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jurusan</SelectItem>
                  {majors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pilih Siswa ({filteredStudents.length})</label>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold" onClick={toggleSelectAll}>
                  {selectedIds.size === filteredStudents.length ? 'Batal Semua' : 'Pilih Semua'}
                </Button>
              </div>
              <div className="max-h-[450px] overflow-y-auto border rounded-xl divide-y bg-muted/5 scrollbar-thin">
                {filteredStudents.length > 0 ? filteredStudents.map(s => (
                  <div 
                    key={s.id} 
                    className={`p-3 text-xs cursor-pointer hover:bg-white flex items-center justify-between transition-colors ${previewId === s.id ? 'bg-white border-l-4 border-primary shadow-sm' : ''}`}
                    onClick={() => setPreviewId(s.id)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div onClick={(e) => toggleSelect(s.id, e)} className="shrink-0">
                        {selectedIds.has(s.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="truncate">
                         <div className="font-bold truncate text-slate-800">{s.name}</div>
                         <div className="text-[9px] text-muted-foreground">{s.nis} • {s.class}</div>
                      </div>
                    </div>
                    <Eye className={`h-4 w-4 shrink-0 ${previewId === s.id ? 'text-primary' : 'opacity-10'}`} />
                  </div>
                )) : (
                  <div className="p-10 text-center text-xs text-muted-foreground italic">Siswa tidak ditemukan</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex justify-between items-center">
               <CardTitle className="text-lg">Pratinjau Hasil Cetak</CardTitle>
               <Badge variant="outline" className="bg-white">{activeTemplate?.name || 'Default Template'}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-10 py-12 bg-muted/10 rounded-b-lg">
            {previewStudent && settings ? (
              <>
                <div className="space-y-4 flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Tampak Depan</span>
                  <div ref={cardRefFront} className="shadow-2xl">
                    <StudentCardVisual student={previewStudent} settings={settings} side="front" template={activeTemplate} />
                  </div>
                </div>
                <div className="space-y-4 flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Tampak Belakang</span>
                  <div ref={cardRefBack} className="shadow-2xl">
                    <StudentCardVisual student={previewStudent} settings={settings} side="back" template={activeTemplate} />
                  </div>
                </div>
                <div className="flex gap-3 w-full max-w-sm pt-6 border-t">
                   <Button variant="outline" className="flex-1 gap-2 h-12 font-bold" onClick={handleDownloadSingle} disabled={isProcessing}>
                     {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                     UNDUH PDF
                   </Button>
                   <Button className="flex-1 gap-2 h-12 font-bold" onClick={() => {
                     setSelectedIds(new Set([previewStudent.id]));
                     setIsPrintModalOpen(true);
                   }}>
                     <Printer className="h-4 w-4" /> CETAK
                   </Button>
                </div>
              </>
            ) : (
              <div className="py-32 flex flex-col items-center gap-4 text-muted-foreground italic">
                <Users className="h-12 w-12 opacity-10" />
                <span>Pilih siswa di sebelah kiri untuk pratinjau</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-md no-print rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Konfirmasi Cetak</DialogTitle>
            <DialogDescription>
              Anda akan mencetak <strong>{selectedIds.size}</strong> kartu pelajar sekaligus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsPrintModalOpen(false)}>Batal</Button>
            <Button className="gap-2 px-8 shadow-lg shadow-primary/20" onClick={() => { setIsPrintModalOpen(false); setTimeout(() => window.print(), 500); }}>
              <Printer className="h-4 w-4" /> Mulai Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
