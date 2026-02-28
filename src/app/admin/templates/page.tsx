
"use client";

import { useState } from 'react';
import { CardTemplate, TemplateType, Student, SchoolSettings } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, 
  Plus, 
  Trash2,
  Loader2,
  RefreshCw,
  Palette,
  Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { StudentCardVisual } from '@/components/student-card-visual';
import { ExamCardVisual } from '@/components/exam-card-visual';
import { IdCardVisual } from '@/components/id-card-visual';

export default function TemplatesPage() {
  const db = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<TemplateType>('STUDENT_CARD');

  const templatesQuery = useMemoFirebase(() => db ? collection(db, 'templates') : null, [db]);
  const { data: templatesData, isLoading } = useCollection<CardTemplate>(templatesQuery);
  const templates = templatesData || [];

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'school_settings', 'default') : null, [db]);
  const { data: settings } = useDoc<SchoolSettings>(settingsRef);

  // Dummy student for preview
  const dummyStudent: Student = {
    id: 'preview',
    name: 'ANDI PRATAMA',
    nis: '2021001',
    nisn: '0051234567',
    class: 'XII',
    major: 'TEKNIK KOMPUTER & JARINGAN',
    school_year: '2023/2024',
    status: 'Aktif',
    valid_until: '2024-06-30',
    card_code: 'CC-TKJ-001',
    photo_url: 'https://picsum.photos/seed/student1/300/400'
  };

  const handleAddTemplate = async () => {
    if (!newTemplateName.trim() || !db) return;
    
    const newTemplate = {
      name: newTemplateName,
      type: newTemplateType,
      config_json: '{}',
      is_active: false,
      preview_color: newTemplateType === 'STUDENT_CARD' ? 'bg-blue-600' : (newTemplateType === 'EXAM_CARD' ? 'bg-orange-500' : 'bg-emerald-800')
    };

    try {
      await addDoc(collection(db, 'templates'), newTemplate);
      setIsAddOpen(false);
      setNewTemplateName('');
      toast({ title: "Template Dibuat", description: "Varian desain baru telah tersimpan." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan." });
    }
  };

  const handleToggleActive = async (id: string, type: TemplateType) => {
    if (!db) return;
    try {
      const q = query(collection(db, 'templates'), where('type', '==', type));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await updateDoc(doc(db, 'templates', d.id), { is_active: d.id === id });
      }
      toast({ title: "Template Diaktifkan", description: "Desain kartu berhasil diperbarui." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat mengubah status aktif." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'templates', id));
      toast({ title: "Dihapus", description: "Template telah dihapus." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat menghapus data." });
    }
  };

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
       <Loader2 className="h-10 w-10 animate-spin text-primary" />
       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Menyiapkan Visual Editor...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline text-[#2E50B8] tracking-tight uppercase">Template Desain</h1>
          <p className="text-muted-foreground mt-1 font-medium">Visual Editor dengan fitur Drag & Drop tata letak identitas.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-white border-slate-200 text-slate-600 font-bold rounded-xl h-11 shadow-sm">
            <RefreshCw className="h-4 w-4" /> REFRESH SUMBER DATA
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-[#2E50B8] hover:bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[10px] rounded-xl h-11 px-6 shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4" /> BUAT VARIAN DESAIN
          </Button>
        </div>
      </div>

      {/* TEMPLATES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.length > 0 ? templates.map((template) => (
          <div 
            key={template.id} 
            className={`group relative flex flex-col bg-white rounded-[2.5rem] border-[3px] transition-all duration-500 p-8 shadow-sm ${template.is_active ? "border-[#2E50B8] shadow-2xl shadow-blue-500/10" : "border-slate-100 hover:border-slate-200 hover:shadow-xl"}`}
          >
            {/* Header Card */}
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${template.preview_color || 'bg-slate-400'}`}>
                <Layout className="h-6 w-6" />
              </div>
              {template.is_active && (
                <Badge className="bg-[#2E50B8] hover:bg-[#2E50B8] rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest">
                  AKTIF
                </Badge>
              )}
            </div>

            {/* Title & Type */}
            <div className="mb-8">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 leading-tight">{template.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">{template.type.replace('_', ' ')}</p>
            </div>

            {/* Visual Preview Container */}
            <div className="flex-1 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100 p-6 flex flex-col items-center gap-8 mb-8">
              <div className="space-y-4 w-full flex flex-col items-center">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">TAMPAK DEPAN</span>
                <div className="scale-[0.5] origin-top -mb-[100px] shadow-2xl rounded-xl overflow-hidden">
                  {renderPreview(template.type, dummyStudent, settings, 'front', template)}
                </div>
              </div>
              <div className="space-y-4 w-full flex flex-col items-center pt-4">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">TAMPAK BELAKANG</span>
                <div className="scale-[0.5] origin-top -mb-[100px] shadow-2xl rounded-xl overflow-hidden">
                  {renderPreview(template.type, dummyStudent, settings, 'back', template)}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3">
              <Button 
                className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${template.is_active ? 'bg-[#2E50B8]/10 text-[#2E50B8] border-none hover:bg-[#2E50B8]/20' : 'bg-slate-100 text-slate-400 hover:bg-[#2E50B8] hover:text-white'}`}
                onClick={() => handleToggleActive(template.id, template.type)} 
                disabled={template.is_active}
              >
                {template.is_active ? 'AKTIF' : 'AKTIFKAN'}
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2 border-slate-100 text-slate-400 hover:text-[#2E50B8] hover:border-[#2E50B8] transition-colors">
                <Palette className="h-5 w-5" />
              </Button>
              {!template.is_active && (
                <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)} className="h-12 w-12 rounded-xl text-red-200 hover:text-red-500 hover:bg-red-50">
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full py-32 text-center">
            <div className="flex flex-col items-center gap-4 opacity-20">
              <Layout className="h-20 w-20" />
              <p className="font-black uppercase tracking-[0.3em] text-sm">Belum ada template terdaftar</p>
            </div>
          </div>
        )}
      </div>

      {/* ADD DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#2E50B8] p-8 text-white text-center">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Buat Varian Desain</DialogTitle>
              <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1">Personalisasi Layout Kartu</p>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nama Varian</Label>
              <Input 
                value={newTemplateName} 
                onChange={e => setNewTemplateName(e.target.value)} 
                placeholder="Contoh: Modern Blue Style" 
                className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Jenis Kartu</Label>
              <Select value={newTemplateType} onValueChange={(v: any) => setNewTemplateType(v)}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  <SelectItem value="STUDENT_CARD">Kartu Pelajar</SelectItem>
                  <SelectItem value="EXAM_CARD">Kartu Ujian</SelectItem>
                  <SelectItem value="ID_CARD">ID Card Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t">
            <Button onClick={handleAddTemplate} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 bg-[#2E50B8]">
              SIMPAN VARIAN BARU
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function renderPreview(type: TemplateType, student: Student, settings: SchoolSettings | null, side: 'front' | 'back', template: CardTemplate) {
  if (!settings) return <div className="w-[340px] h-[215px] bg-slate-100 animate-pulse" />;
  
  switch(type) {
    case 'STUDENT_CARD':
      return <StudentCardVisual student={student} settings={settings} side={side} template={template} />;
    case 'EXAM_CARD':
      return <ExamCardVisual student={student} settings={settings} side={side} template={template} />;
    case 'ID_CARD':
      return <IdCardVisual student={student} settings={settings} side={side} template={template} />;
    default:
      return null;
  }
}
