"use client";

import { useState, useEffect, useRef } from 'react';
import { getDB } from '@/app/lib/db';
import { Student, SchoolSettings, CardTemplate } from '@/app/lib/types';
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
    setTimeout(() => {
      window.print();
      setIsPrintModalOpen(false);
    }, 250);
  };

  return (
    <div className="space-y-6">
      <div id="print-area">
        <div className="flex flex-col items-center gap-10 p-10">
          {(selectedIds.size > 0 ? Array.from(selectedIds) : (previewId ? [previewId] : [])).map(id => {
            const s = students.find(x => x.id === id);
            return s && settings ? (
              <div key={id} className="page-break flex flex-col gap-6 items-center mb-10 pb-10 border-b border-dashed">
                <StudentCardVisual student={s} settings={settings} side="front" template={activeTemplate} />
                <StudentCardVisual student={s} settings={settings} side="back" template={activeTemplate} />
              </div>
            ) : null;
          })}
        </div>
      </div>

      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Kartu Pelajar</h1>
          <p className="text-muted-foreground">Generate dan cetak kartu pelajar siswa secara massal.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast({title: "Segera Hadir"})}>
            <FileDown className="h-4 w-4" /> Export CSV
          </Button>
          <Button className="gap-2" onClick={() => setIsPrintModalOpen(true)} disabled={selectedIds.size === 0}>
            <Printer className="h-4 w-4" /> Cetak Massal ({selectedIds.size})
          </Button>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Filter & Navigasi</CardTitle>
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
                <label className="text-xs font-bold uppercase text-muted-foreground">Daftar Siswa</label>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={toggleSelectAll}>
                  {selectedIds.size === filteredStudents.length ? 'Batal' : 'Pilih Semua'}
                </Button>
              </div>
              <div className="max-h-[400px] overflow-y-auto border rounded divide-y bg-muted/5">
                {filteredStudents.map(s => (
                  <div 
                    key={s.id} 
                    className={`p-2.5 text-xs cursor-pointer hover:bg-white flex items-center justify-between transition-colors ${previewId === s.id ? 'bg-white border-l-4 border-primary' : ''}`}
                    onClick={() => setPreviewId(s.id)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div onClick={(e) => toggleSelect(s.id, e)}>
                        {selectedIds.has(s.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-semibold truncate">{s.name}</span>
                    </div>
                    <Eye className={`h-3 w-3 ${previewId === s.id ? 'text-primary' : 'opacity-20'}`} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Pratinjau Kartu</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8 py-10 bg-muted/5 rounded-b-lg">
            {previewStudent && settings ? (
              <>
                <div ref={cardRefFront} className="shadow-2xl">
                  <StudentCardVisual student={previewStudent} settings={settings} side="front" template={activeTemplate} />
                </div>
                <div ref={cardRefBack} className="shadow-2xl">
                  <StudentCardVisual student={previewStudent} settings={settings} side="back" template={activeTemplate} />
                </div>
                <div className="flex gap-3 w-full max-w-sm">
                   <Button variant="outline" className="flex-1 gap-2" onClick={handleDownloadSingle} disabled={isProcessing}>
                     {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                     PDF
                   </Button>
                   <Button className="flex-1 gap-2" onClick={handlePrint}>
                     <Printer className="h-4 w-4" /> Cetak
                   </Button>
                </div>
              </>
            ) : (
              <div className="py-20 text-muted-foreground italic">Pilih siswa untuk melihat pratinjau</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-2xl no-print">
          <DialogHeader>
            <DialogTitle>Konfirmasi Cetak Massal</DialogTitle>
            <DialogDescription>Anda akan mencetak {selectedIds.size} kartu pelajar.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPrintModalOpen(false)}>Batal</Button>
            <Button className="gap-2" onClick={handlePrint}><Printer className="h-4 w-4" /> Mulai Cetak</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
