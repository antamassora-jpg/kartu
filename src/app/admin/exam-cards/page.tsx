"use client";

import { useState, useEffect, useRef } from 'react';
import { getDB } from '@/app/lib/db';
import { Student, SchoolSettings, ExamEvent, CardTemplate } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  AlertCircle,
  GraduationCap,
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
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function ExamCardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<ExamEvent[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<CardTemplate | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
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

  useEffect(() => {
    const db = getDB();
    setStudents(db.students);
    setSettings(db.school_settings);
    setExams(db.exams);
    const template = db.templates.find(t => t.type === 'EXAM_CARD' && t.is_active);
    setActiveTemplate(template || null);
    if (db.exams.length > 0) setSelectedExamId(db.exams[0].id);
    if (db.students.length > 0) setPreviewId(db.students[0].id);
  }, []);

  const selectedExam = exams.find(e => e.id === selectedExamId);
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
    if (!previewStudent || !cardRefFront.current || !cardRefBack.current) return;
    setIsProcessing(true);
    
    try {
      const canvasFront = await html2canvas(cardRefFront.current, { scale: 3, useCORS: true });
      const canvasBack = await html2canvas(cardRefBack.current, { scale: 3, useCORS: true });

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });
      pdf.addImage(canvasFront.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 85.6, 54);
      pdf.addPage([85.6, 54], 'landscape');
      pdf.addImage(canvasBack.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 85.6, 54);

      pdf.save(`Kartu_Ujian_${previewStudent.name.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "Berhasil", description: "PDF Kartu Ujian telah diunduh." });
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
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });
      const cardElements = bulkContainerRef.current.querySelectorAll('.page-break');
      
      for (let i = 0; i < cardElements.length; i++) {
        const set = cardElements[i];
        const front = set.querySelector('.visual-front') as HTMLElement;
        const back = set.querySelector('.visual-back') as HTMLElement;

        if (!front || !back) continue;

        if (i > 0) pdf.addPage([85.6, 54], 'landscape');
        
        await new Promise(r => setTimeout(r, 100));
        
        const canvasFront = await html2canvas(front, { 
          scale: 2, 
          useCORS: true,
          logging: false 
        });
        pdf.addImage(canvasFront.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 85.6, 54);
        
        pdf.addPage([85.6, 54], 'landscape');
        const canvasBack = await html2canvas(back, { 
          scale: 2, 
          useCORS: true,
          logging: false 
        });
        pdf.addImage(canvasBack.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 85.6, 54);
      }

      pdf.save(`Bulk_Kartu_Ujian_${new Date().getTime()}.pdf`);
      toast({ title: "Berhasil", description: "Dokumen PDF massal telah diunduh." });
    } catch (error) {
      console.error('Download Bulk Error:', error);
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat membuat PDF massal." });
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!selectedExamId) {
      toast({ variant: "destructive", title: "Pilih Ujian", description: "Silahkan pilih event ujian terlebih dahulu." });
      return;
    }
    setIsPrintModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Area Cetak Khusus */}
      <div id="print-area" ref={bulkContainerRef}>
        {Array.from(selectedIds).map(id => {
          const s = students.find(x => x.id === id);
          return s && settings ? (
            <div key={id} className="page-break">
              <div className="print-card-gap visual-front">
                <ExamCardVisual student={s} settings={settings} exam={selectedExam} side="front" template={activeTemplate} />
              </div>
              <div className="visual-back">
                <ExamCardVisual student={s} settings={settings} exam={selectedExam} side="back" template={activeTemplate} />
              </div>
            </div>
          ) : null;
        })}
      </div>

      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Kartu Ujian</h1>
          <p className="text-muted-foreground">Cetak kartu tanda peserta ujian untuk siswa.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 shadow-sm border-2 border-orange-200 text-orange-700 hover:bg-orange-50" onClick={handleDownloadBulk} disabled={selectedIds.size === 0 || isBulkDownloading}>
            {isBulkDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Unduh PDF Massal ({selectedIds.size})
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
                <FileText className="h-5 w-5 text-orange-600" /> Event Ujian
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Event Ujian" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.semester})</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Filter Peserta
              </CardTitle>
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
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {classes.map(c => <SelectItem key={c} value={c}>Kelas {c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                  <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jurusan</SelectItem>
                    {majors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Daftar Nama ({filteredStudents.length})</span>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold" onClick={toggleSelectAll}>
                    {selectedIds.size === filteredStudents.length ? 'Batal' : 'Pilih Semua'}
                  </Button>
                </div>
                <div className="max-h-[300px] overflow-y-auto border rounded-xl divide-y bg-muted/5 scrollbar-thin">
                  {filteredStudents.length > 0 ? filteredStudents.map(s => (
                    <div 
                      key={s.id} 
                      className={`p-3 text-xs cursor-pointer hover:bg-white flex items-center justify-between transition-colors ${previewId === s.id ? 'bg-white border-l-4 border-orange-500 shadow-sm' : ''}`}
                      onClick={() => setPreviewId(s.id)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div onClick={(e) => toggleSelect(s.id, e)} className="shrink-0">
                          {selectedIds.has(s.id) ? (
                            <CheckSquare className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="font-bold truncate">{s.name}</div>
                          <div className="text-[9px] text-muted-foreground">{s.nis}</div>
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
            <CardTitle className="text-lg">Pratinjau Kartu Ujian</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-10 py-12 bg-muted/5 rounded-b-lg">
            {previewStudent && settings ? (
              <>
                <div className="space-y-4 flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Halaman Depan</span>
                  <div ref={cardRefFront} className="shadow-2xl">
                    <ExamCardVisual student={previewStudent} settings={settings} exam={selectedExam} side="front" template={activeTemplate} />
                  </div>
                </div>
                <div className="space-y-4 flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Halaman Belakang</span>
                  <div ref={cardRefBack} className="shadow-2xl">
                    <ExamCardVisual student={previewStudent} settings={settings} exam={selectedExam} side="back" template={activeTemplate} />
                  </div>
                </div>
                <div className="flex gap-3 w-full max-w-sm pt-6 border-t">
                  <Button variant="outline" className="flex-1 gap-2 h-12 font-bold" onClick={handleDownloadSingle} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    UNDUH PDF
                  </Button>
                  <Button className="flex-1 gap-2 h-12 font-bold bg-orange-600 hover:bg-orange-700" onClick={() => {
                    setSelectedIds(new Set([previewStudent.id]));
                    setIsPrintModalOpen(true);
                  }}>
                    <Printer className="h-4 w-4" /> CETAK
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-32 text-muted-foreground italic flex flex-col items-center gap-4">
                 <GraduationCap className="h-12 w-12 opacity-10" />
                 <span>Pilih peserta untuk pratinjau</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-md no-print rounded-2xl">
          <DialogHeader>
            <DialogTitle>Konfirmasi Cetak Massal</DialogTitle>
            <DialogDescription>
              Anda akan mencetak {selectedIds.size} kartu ujian untuk event <strong>{selectedExam?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-orange-50 p-4 border border-orange-200 rounded-xl flex items-start gap-3">
             <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
             <div className="text-xs space-y-1">
               <p className="font-bold text-orange-900 leading-tight">Petunjuk Penting:</p>
               <ul className="list-disc list-inside text-orange-800 space-y-0.5">
                 <li>Gunakan kertas kaku (minimal 210gsm).</li>
                 <li>Aktifkan "Background Graphics" di pengaturan print.</li>
               </ul>
             </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsPrintModalOpen(false)}>Batal</Button>
            <Button className="gap-2 bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Cetak Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}