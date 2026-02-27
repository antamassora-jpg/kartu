"use client";

import { useState, useEffect, useRef } from 'react';
import { getDB } from '@/app/lib/db';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StudentCardVisual } from '@/components/student-card-visual';
import { 
  Printer, 
  Download, 
  Eye, 
  Search, 
  CheckSquare, 
  Square,
  Loader2,
  Users
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

export default function CardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<CardTemplate | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  const cardRefFront = useRef<HTMLDivElement>(null);
  const cardRefBack = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const db = getDB();
    setStudents(db.students);
    setSettings(db.school_settings);
    const template = db.templates.find(t => t.type === 'STUDENT_CARD' && t.is_active);
    setActiveTemplate(template || null);
    if (db.students.length > 0) setPreviewId(db.students[0].id);
  }, []);

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
      pdf.addImage(canvasFront.toDataURL('image/png'), 'PNG', 0, 0, 85.6, 54);
      pdf.addPage([85.6, 54], 'landscape');
      pdf.addImage(canvasBack.toDataURL('image/png'), 'PNG', 0, 0, 85.6, 54);
      pdf.save(`Kartu_Pelajar_${previewStudent.name.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "Berhasil", description: "Kartu telah diunduh." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal membuat PDF." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    setIsPrintModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Area Cetak Khusus */}
      <div id="print-area">
        {Array.from(selectedIds).map(id => {
          const s = students.find(x => x.id === id);
          return s && settings ? (
            <div key={id} className="page-break">
              <div className="print-card-gap">
                <StudentCardVisual student={s} settings={settings} side="front" template={activeTemplate} />
              </div>
              <div>
                <StudentCardVisual student={s} settings={settings} side="back" template={activeTemplate} />
              </div>
            </div>
          ) : null;
        })}
      </div>

      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Kartu Pelajar</h1>
          <p className="text-muted-foreground">Generate dan cetak kartu pelajar siswa secara massal.</p>
        </div>
        <div className="flex gap-2">
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
                placeholder="Cari nama, NIS, atau NISN..." 
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
                  <div ref={cardRefFront} className="shadow-2xl hover:scale-[1.02] transition-transform duration-500">
                    <StudentCardVisual student={previewStudent} settings={settings} side="front" template={activeTemplate} />
                  </div>
                </div>
                <div className="space-y-4 flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Tampak Belakang</span>
                  <div ref={cardRefBack} className="shadow-2xl hover:scale-[1.02] transition-transform duration-500">
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
              Anda akan mencetak <strong>{selectedIds.size}</strong> kartu pelajar sekaligus. Pastikan kertas kartu sudah siap di printer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsPrintModalOpen(false)}>Batal</Button>
            <Button className="gap-2 px-8 shadow-lg shadow-primary/20" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Mulai Cetak Massal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
