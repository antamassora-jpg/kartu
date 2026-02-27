
"use client";

import { useState, useEffect, useRef } from 'react';
import { getDB } from '@/app/lib/db';
import { Student, SchoolSettings, CardTemplate } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Printer, 
  Download, 
  Eye, 
  RefreshCw, 
  Search, 
  CheckSquare, 
  Square,
  Loader2,
  Users,
  FileDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { IdCardVisual } from '@/components/id-card-visual';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function IDCardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<CardTemplate | null>(null);
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
    
    const template = db.templates.find(t => t.type === 'ID_CARD' && t.is_active);
    setActiveTemplate(template || null);
    
    if (db.students.length > 0) setPreviewId(db.students[0].id);
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.nis.includes(searchQuery)
  );

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

      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: [73, 111] 
      });
      
      pdf.addImage(canvasFront.toDataURL('image/png'), 'PNG', 0, 0, 73, 111);
      pdf.addPage([73, 111], 'portrait');
      pdf.addImage(canvasBack.toDataURL('image/png'), 'PNG', 0, 0, 73, 111);
      
      pdf.save(`ID_Card_${previewStudent.name.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "Berhasil", description: "ID Card telah diunduh." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal membuat PDF." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadBulk = async () => {
    if (selectedIds.size === 0 || !bulkContainerRef.current) return;
    setIsBulkDownloading(true);
    toast({ title: "Memulai Proses", description: `Menyiapkan ${selectedIds.size} ID Card dalam satu PDF...` });

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [73, 111] });
      const cardElements = bulkContainerRef.current.querySelectorAll('.page-break');
      
      for (let i = 0; i < cardElements.length; i++) {
        const set = cardElements[i];
        const front = set.querySelector('.visual-front') as HTMLElement;
        const back = set.querySelector('.visual-back') as HTMLElement;

        if (i > 0) pdf.addPage([73, 111], 'portrait');
        
        const canvasFront = await html2canvas(front, { scale: 2, useCORS: true });
        pdf.addImage(canvasFront.toDataURL('image/png'), 'PNG', 0, 0, 73, 111);
        
        pdf.addPage([73, 111], 'portrait');
        const canvasBack = await html2canvas(back, { scale: 2, useCORS: true });
        pdf.addImage(canvasBack.toDataURL('image/png'), 'PNG', 0, 0, 73, 111);
      }

      pdf.save(`Bulk_ID_Cards_${new Date().getTime()}.pdf`);
      toast({ title: "Berhasil", description: "Dokumen PDF massal telah diunduh." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat membuat PDF massal." });
    } finally {
      setIsBulkDownloading(false);
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
      <div id="print-area" ref={bulkContainerRef}>
        {Array.from(selectedIds).map(id => {
          const s = students.find(x => x.id === id);
          return s && settings ? (
            <div key={id} className="page-break">
              <div className="print-card-gap visual-front">
                <IdCardVisual student={s} settings={settings} side="front" template={activeTemplate} />
              </div>
              <div className="visual-back">
                <IdCardVisual student={s} settings={settings} side="back" template={activeTemplate} />
              </div>
            </div>
          ) : null;
        })}
      </div>

      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">ID Card Corporate</h1>
          <p className="text-muted-foreground">Cetak kartu identitas eksklusif dengan ukuran 7.3 x 11.1 cm.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 shadow-sm border-2" onClick={handleDownloadBulk} disabled={selectedIds.size === 0 || isBulkDownloading}>
            {isBulkDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Unduh PDF Massal ({selectedIds.size})
          </Button>
          <Button className="gap-2 shadow-sm" onClick={() => setIsPrintModalOpen(true)} disabled={selectedIds.size === 0}>
            <Printer className="h-4 w-4" /> Cetak Massal ({selectedIds.size})
          </Button>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Daftar Individu</CardTitle>
            <CardDescription>Pilih personil untuk dicetak kartunya.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Daftar Nama</span>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={toggleSelectAll}>
                  {selectedIds.size === filteredStudents.length ? 'Batal' : 'Semua'}
                </Button>
              </div>
              <div className="max-h-[400px] overflow-y-auto border rounded divide-y bg-muted/5">
                {filteredStudents.map(s => (
                  <div 
                    key={s.id} 
                    className={`p-3 text-sm cursor-pointer hover:bg-white flex items-center justify-between transition-colors ${previewId === s.id ? 'bg-white border-l-4 border-primary' : ''}`}
                    onClick={() => setPreviewId(s.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => toggleSelect(s.id, e)}>
                        {selectedIds.has(s.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{s.name}</span>
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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Pratinjau: {activeTemplate?.name || 'Default'}</CardTitle>
                <CardDescription>Layout Vertikal 7.3 x 11.1 cm.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-12 py-10 bg-muted/10 rounded-b-lg overflow-x-auto">
            {previewStudent && settings ? (
              <>
                <div className="flex flex-col md:flex-row gap-12 items-start justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm">Front</span>
                    <div ref={cardRefFront} className="shadow-2xl">
                      <IdCardVisual student={previewStudent} settings={settings} side="front" template={activeTemplate} />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm">Back</span>
                    <div ref={cardRefBack} className="shadow-2xl">
                      <IdCardVisual student={previewStudent} settings={settings} side="back" template={activeTemplate} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 w-full max-w-md pt-8 border-t">
                  <Button variant="outline" className="flex-1 gap-2 h-12" onClick={handleDownloadSingle} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download PDF
                  </Button>
                  <Button className="flex-1 gap-2 h-12" onClick={() => {
                    setSelectedIds(new Set([previewStudent.id]));
                    setIsPrintModalOpen(true);
                  }}>
                    <Printer className="h-4 w-4" /> Cetak Sekarang
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-20 text-muted-foreground italic">Pilih nama untuk pratinjau kartu</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-md no-print rounded-2xl">
          <DialogHeader>
            <DialogTitle>Konfirmasi Cetak</DialogTitle>
            <DialogDescription>
              Anda akan mencetak <strong>{selectedIds.size}</strong> ID Card.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsPrintModalOpen(false)}>Batal</Button>
            <Button className="gap-2 px-8 shadow-lg shadow-primary/20" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Mulai Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
