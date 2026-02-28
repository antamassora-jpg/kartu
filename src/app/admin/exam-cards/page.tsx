
"use client";

import { useState, useRef, useMemo, useEffect } from 'react';
import { Student, SchoolSettings, ExamEvent, CardTemplate } from '@/app/lib/types';
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
import { ExamCardVisual } from '@/components/exam-card-visual';
import { 
  Printer, 
  Download, 
  Eye, 
  Search, 
  CheckSquare, 
  Square,
  Loader2,
  FileText,
  GraduationCap,
  FileDown,
  RefreshCw
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
import { jsPDF } from 'js-pdf'; // Note: check package.json import name, usually 'jspdf'
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';

export default function ExamCardsPage() {
  const db = useFirestore();
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
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

  // Firestore Data Fetching
  const studentsQuery = useMemoFirebase(() => db ? query(collection(db, 'students'), orderBy('name', 'asc')) : null, [db]);
  const { data: studentsData, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);
  const students = studentsData || [];

  const examsQuery = useMemoFirebase(() => db ? query(collection(db, 'exams'), orderBy('start_date', 'desc')) : null, [db]);
  const { data: examsData } = useCollection<ExamEvent>(examsQuery);
  const exams = examsData || [];

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'school_settings', 'default') : null, [db]);
  const { data: settings } = useDoc<SchoolSettings>(settingsRef);

  const templatesQuery = useMemoFirebase(() => db ? collection(db, 'templates') : null, [db]);
  const { data: templates } = useCollection<CardTemplate>(templatesQuery);
  const activeTemplate = templates?.find(t => t.type === 'EXAM_CARD' && t.is_active) || null;

  // Filter Logic
  const classes = useMemo(() => Array.from(new Set(students.map(s => s.class))).filter(Boolean).sort(), [students]);
  const majors = useMemo(() => Array.from(new Set(students.map(s => s.major))).filter(Boolean).sort(), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = selectedClass === 'all' || s.class === selectedClass;
      const matchMajor = selectedMajor === 'all' || s.major === selectedMajor;
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.nis.includes(searchQuery);
      return matchClass && matchMajor && matchSearch;
    });
  }, [students, selectedClass, selectedMajor, searchQuery]);

  const selectedExam = useMemo(() => exams.find(e => e.id === selectedExamId) || (exams.length > 0 ? exams[0] : undefined), [exams, selectedExamId]);
  const previewStudent = useMemo(() => students.find(s => s.id === previewId) || (filteredStudents.length > 0 ? filteredStudents[0] : null), [students, previewId, filteredStudents]);

  // Initial selection for exam
  useEffect(() => {
    if (exams.length > 0 && selectedExamId === 'all') {
      setSelectedExamId(exams[0].id);
    }
  }, [exams]);

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
      const { jsPDF } = await import('jspdf');
      const canvasFront = await captureElement(cardRefFront.current);
      const canvasBack = await captureElement(cardRefBack.current);

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });
      pdf.addImage(canvasFront.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 85.6, 54);
      pdf.addPage([85.6, 54], 'landscape');
      pdf.addImage(canvasBack.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 85.6, 54);
      pdf.save(`Kartu_Ujian_${previewStudent.name.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "Berhasil", description: "Kartu ujian telah diunduh." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal membuat PDF." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadBulk = async () => {
    if (selectedIds.size === 0 || !bulkContainerRef.current) return;
    setIsBulkDownloading(true);
    toast({ title: "Memulai Proses", description: `Menyiapkan ${selectedIds.size} kartu ujian...` });

    try {
      const { jsPDF } = await import('jspdf');
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

      pdf.save(`Bulk_Kartu_Ujian_${new Date().getTime()}.pdf`);
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
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sinkronisasi Database Ujian...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Area Cetak Tersembunyi */}
      <div id="print-area" ref={bulkContainerRef}>
        {Array.from(selectedIds).map(id => {
          const s = students.find(x => x.id === id);
          return s && settings ? (
            <div key={id} className="page-break">
              <div className="print-card-gap visual-front">
                <ExamCardVisual student={s} settings={settings} side="front" template={activeTemplate} exam={selectedExam} />
              </div>
              <div className="visual-back">
                <ExamCardVisual student={s} settings={settings} side="back" template={activeTemplate} exam={selectedExam} />
              </div>
            </div>
          ) : null;
        })}
      </div>

      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Kartu Ujian</h1>
          <p className="text-muted-foreground">Generate kartu tanda peserta ujian berbasis event secara massal.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 shadow-sm border-2 border-orange-200 text-orange-700 hover:bg-orange-50" onClick={handleDownloadBulk} disabled={selectedIds.size === 0 || isBulkDownloading}>
            {isBulkDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Unduh PDF ({selectedIds.size})
          </Button>
          <Button className="gap-2 shadow-lg shadow-orange-500/20 bg-orange-600 hover:bg-orange-700" onClick={() => setIsPrintModalOpen(true)} disabled={selectedIds.size === 0}>
            <Printer className="h-4 w-4" /> Cetak Massal ({selectedIds.size})
          </Button>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-orange-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" /> Pilih Event Ujian
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Pilih Event Ujian" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.semester})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Daftar Siswa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari nama, NIS..." 
                  className="pl-9 h-11 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger size="sm" className="rounded-lg"><SelectValue placeholder="Kelas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                  <SelectTrigger size="sm" className="rounded-lg"><SelectValue placeholder="Jurusan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jurusan</SelectItem>
                    {majors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pilih Peserta ({filteredStudents.length})</label>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold" onClick={toggleSelectAll}>
                    {selectedIds.size === filteredStudents.length ? 'Batal Semua' : 'Pilih Semua'}
                  </Button>
                </div>
                <div className="max-h-[400px] overflow-y-auto border rounded-xl divide-y bg-muted/5 scrollbar-thin">
                  {filteredStudents.length > 0 ? filteredStudents.map(s => (
                    <div 
                      key={s.id} 
                      className={`p-3 text-xs cursor-pointer hover:bg-white flex items-center justify-between transition-colors ${previewId === s.id ? 'bg-white border-l-4 border-orange-500 shadow-sm' : ''}`}
                      onClick={() => setPreviewId(s.id)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div onClick={(e) => toggleSelect(s.id, e)} className="shrink-0">
                          {selectedIds.has(s.id) ? (
                            <CheckSquare className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="truncate">
                           <div className="font-bold truncate text-slate-800">{s.name}</div>
                           <div className="text-[9px] text-muted-foreground">{s.nis} • {s.class}</div>
                        </div>
                      </div>
                      <Eye className={`h-4 w-4 shrink-0 ${previewId === s.id ? 'text-orange-600' : 'opacity-10'}`} />
                    </div>
                  )) : (
                    <div className="p-10 text-center text-xs text-muted-foreground italic">Siswa tidak ditemukan</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex justify-between items-center">
               <CardTitle className="text-lg">Pratinjau Hasil Cetak</CardTitle>
               <div className="flex items-center gap-2">
                 <Badge variant="outline" className="bg-white text-orange-600 border-orange-200">{selectedExam?.name || 'Pilih Ujian'}</Badge>
                 <Badge variant="outline" className="bg-white">{activeTemplate?.name || 'Default Template'}</Badge>
               </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-10 py-12 bg-muted/10 rounded-b-lg">
            {previewStudent && settings ? (
              <>
                <div className="space-y-4 flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Halaman Depan</span>
                  <div ref={cardRefFront} className="shadow-2xl">
                    <ExamCardVisual student={previewStudent} settings={settings} side="front" template={activeTemplate} exam={selectedExam} />
                  </div>
                </div>
                <div className="space-y-4 flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Halaman Belakang</span>
                  <div ref={cardRefBack} className="shadow-2xl">
                    <ExamCardVisual student={previewStudent} settings={settings} side="back" template={activeTemplate} exam={selectedExam} />
                  </div>
                </div>
                <div className="flex gap-3 w-full max-w-sm pt-6 border-t">
                   <Button variant="outline" className="flex-1 gap-2 h-12 font-bold rounded-xl" onClick={handleDownloadSingle} disabled={isProcessing}>
                     {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                     UNDUH PDF
                   </Button>
                   <Button className="flex-1 gap-2 h-12 font-bold bg-orange-600 hover:bg-orange-700 rounded-xl" onClick={() => {
                     setSelectedIds(new Set([previewStudent.id]));
                     setIsPrintModalOpen(true);
                   }}>
                     <Printer className="h-4 w-4" /> CETAK
                   </Button>
                </div>
              </>
            ) : (
              <div className="py-32 flex flex-col items-center gap-4 text-muted-foreground italic">
                <GraduationCap className="h-12 w-12 opacity-10" />
                <span>Pilih siswa di sebelah kiri untuk pratinjau kartu ujian</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-md no-print rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Konfirmasi Cetak Ujian</DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Anda akan mencetak <strong>{selectedIds.size}</strong> kartu ujian untuk event <span className="text-orange-600 font-bold">{selectedExam?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-orange-50 p-4 border border-orange-100 rounded-2xl text-[10px] text-orange-800 leading-relaxed">
            <p className="font-bold mb-1 uppercase tracking-wider">Tips Cetak:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Gunakan kertas minimal 210gsm (Art Carton/BW).</li>
              <li>Pastikan pengaturan "Background Graphics" aktif di browser.</li>
              <li>Gunakan tinta berkualitas untuk Barcode/QR yang mudah dipindai.</li>
            </ul>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsPrintModalOpen(false)} className="rounded-xl">Batal</Button>
            <Button className="gap-2 px-8 shadow-lg shadow-orange-500/20 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold" onClick={() => { setIsPrintModalOpen(false); setTimeout(() => window.print(), 500); }}>
              <Printer className="h-4 w-4" /> Mulai Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
