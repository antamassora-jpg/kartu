
"use client";

import { useState, useRef, useMemo } from 'react';
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
  FileDown,
  Layout
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
import { Checkbox } from '@/components/ui/checkbox';

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

  const classes = useMemo(() => Array.from(new Set(students.map(s => s.class))).filter(Boolean).sort(), [students]);
  const majors = useMemo(() => Array.from(new Set(students.map(s => s.major))).filter(Boolean).sort(), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = selectedClass === 'all' || s.class === selectedClass;
      const matchMajor = selectedMajor === 'all' || s.major === selectedMajor;
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.nis && s.nis.includes(searchQuery));
      return matchClass && matchMajor && matchSearch;
    });
  }, [students, selectedClass, selectedMajor, searchQuery]);

  const previewStudent = useMemo(() => {
    if (previewId) return students.find(s => s.id === previewId);
    if (filteredStudents.length > 0) return filteredStudents[0];
    return null;
  }, [students, previewId, filteredStudents]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const captureElement = async (el: HTMLElement) => {
    return await html2canvas(el, {
      scale: 3,
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
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Menghubungkan ke Database Cloud...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Print Area (Hidden) */}
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

      {/* Header Section */}
      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline text-[#2E50B8] tracking-tight">Kartu Pelajar</h1>
          <p className="text-muted-foreground font-medium">Generate dan cetak kartu pelajar siswa secara massal.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-slate-50 border-slate-200 text-slate-600 font-bold rounded-xl h-11 shadow-sm" onClick={handleDownloadBulk} disabled={selectedIds.size === 0 || isBulkDownloading}>
            {isBulkDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Unduh PDF Massal ({selectedIds.size})
          </Button>
          <Button className="gap-2 bg-[#2E50B8] hover:bg-[#1e3a8a] text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-blue-500/20" onClick={() => setIsPrintModalOpen(true)} disabled={selectedIds.size === 0}>
            <Printer className="h-4 w-4" /> Cetak Massal ({selectedIds.size})
          </Button>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student List Sidebar */}
        <Card className="lg:col-span-4 border-none shadow-sm rounded-[1.5rem] overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
              <Users className="h-5 w-5 text-[#2E50B8]" /> Daftar Siswa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" />
              <Input 
                placeholder="Cari nama, NIS, atau NISN..." 
                className="pl-9 h-11 bg-slate-50 border-none rounded-xl font-medium focus-visible:ring-1 focus-visible:ring-slate-200" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-slate-600">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map(c => <SelectItem key={c} value={c}>Kelas {c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-slate-600">
                  <SelectValue placeholder="Semua Jurusan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jurusan</SelectItem>
                  {majors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">PILIH SISWA ({filteredStudents.length})</span>
              <Button variant="link" className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-[#2E50B8]" onClick={toggleSelectAll}>
                {selectedIds.size === filteredStudents.length && filteredStudents.length > 0 ? 'Batal Semua' : 'Pilih Semua'}
              </Button>
            </div>

            <div className="max-h-[500px] overflow-y-auto pr-1 space-y-1 custom-scrollbar">
              {filteredStudents.length > 0 ? filteredStudents.map(s => (
                <div 
                  key={s.id} 
                  className={`group p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer border ${previewId === s.id ? 'bg-white border-[#2E50B8] shadow-md' : 'bg-white border-transparent hover:bg-slate-50'}`}
                  onClick={() => setPreviewId(s.id)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div onClick={(e) => { e.stopPropagation(); toggleSelect(s.id); }} className="shrink-0">
                      <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} className="h-5 w-5 rounded-md border-slate-200" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-sm text-slate-800 leading-tight">{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{s.nis} • {s.class}</div>
                    </div>
                  </div>
                  <Eye className={`h-4 w-4 transition-colors ${previewId === s.id ? 'text-[#2E50B8]' : 'text-slate-200 group-hover:text-slate-400'}`} />
                </div>
              )) : (
                <div className="py-20 text-center text-xs text-muted-foreground italic font-medium">Data tidak ditemukan</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Preview Area */}
        <Card className="lg:col-span-8 border-none shadow-sm rounded-[1.5rem] overflow-hidden flex flex-col">
          <CardHeader className="bg-white border-b border-slate-50 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-bold text-slate-800">Pratinjau Hasil Cetak</CardTitle>
            <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 border-slate-100 bg-white">
              {activeTemplate?.name || 'Modern Blue Style'}
            </Badge>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center py-12 bg-slate-50/30 overflow-auto">
            {previewStudent && settings ? (
              <div className="flex flex-col items-center gap-12 w-full max-w-2xl px-4">
                <div className="flex flex-col items-center gap-4 w-full">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">TAMPAK DEPAN</span>
                  <div ref={cardRefFront} className="shadow-[0_20px_50px_-12px_rgba(46,80,184,0.25)] rounded-xl overflow-hidden transition-transform hover:scale-[1.02] duration-500 bg-white">
                    <StudentCardVisual student={previewStudent} settings={settings} side="front" template={activeTemplate} />
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-4 w-full">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">TAMPAK BELAKANG</span>
                  <div ref={cardRefBack} className="shadow-[0_20px_50px_-12px_rgba(46,80,184,0.2)] rounded-xl overflow-hidden transition-transform hover:scale-[1.02] duration-500 bg-white">
                    <StudentCardVisual student={previewStudent} settings={settings} side="back" template={activeTemplate} />
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 mt-4" />

                <div className="flex gap-4 w-full max-w-sm">
                  <Button variant="outline" className="flex-1 h-14 font-black uppercase tracking-widest text-[10px] rounded-2xl border-2 border-slate-100 hover:bg-slate-50 gap-2" onClick={handleDownloadSingle} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} UNDUH PDF
                  </Button>
                  <Button className="flex-1 h-14 font-black uppercase tracking-widest text-[10px] rounded-2xl bg-[#2E50B8] hover:bg-[#1e3a8a] shadow-xl shadow-blue-500/20 gap-2" onClick={() => { setSelectedIds(new Set([previewStudent.id])); setIsPrintModalOpen(true); }}>
                    <Printer className="h-4 w-4" /> CETAK
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-32 opacity-20">
                <Layout className="h-20 w-20 text-slate-400" />
                <p className="font-black uppercase tracking-[0.3em] text-sm text-slate-400">Pilih siswa untuk pratinjau</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#2E50B8] mx-auto mb-2">
              <Printer className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-center">Konfirmasi Cetak</DialogTitle>
            <DialogDescription className="text-center font-medium leading-relaxed">
              Anda akan mencetak <strong className="text-[#2E50B8]">{selectedIds.size}</strong> kartu pelajar sekaligus. Pastikan kertas kartu sudah siap di printer Anda.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
            <Button variant="ghost" onClick={() => setIsPrintModalOpen(false)} className="h-12 rounded-xl font-bold text-slate-400">Batal</Button>
            <Button className="h-12 rounded-xl font-black bg-[#2E50B8] hover:bg-[#1e3a8a] shadow-lg shadow-blue-500/20 uppercase tracking-widest text-[10px]" onClick={() => { setIsPrintModalOpen(false); setTimeout(() => window.print(), 500); }}>MULAI CETAK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
