
"use client";

import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/app/lib/db';
import { CardTemplate, SchoolSettings, Student, TemplateType } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, 
  Palette, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2,
  Loader2,
  Type
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { StudentCardVisual } from '@/components/student-card-visual';
import { ExamCardVisual } from '@/components/exam-card-visual';
import { IdCardVisual } from '@/components/id-card-visual';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const FONT_OPTIONS = [
  { name: 'Inter (Default)', value: 'Inter, sans-serif' },
  { name: 'Oswald (Bold Display)', value: 'Oswald, sans-serif' },
  { name: 'Montserrat (Modern)', value: 'Montserrat, sans-serif' },
  { name: 'Playfair Display (Elegant)', value: 'Playfair Display, serif' },
  { name: 'Roboto Mono (Technical)', value: 'Roboto Mono, monospace' },
];

const DEFAULT_CONFIG = {
  front: { headerBg: '#2E50B8', bodyBg: '#ffffff', footerBg: '#4FBFDD', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif' },
  back: { headerBg: '#2E50B8', bodyBg: '#ffffff', footerBg: '#4FBFDD', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif' }
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);
  const [localConfig, setLocalConfig] = useState<any>(DEFAULT_CONFIG);

  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<TemplateType>('STUDENT_CARD');
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const refreshData = () => {
    const db = getDB();
    setTemplates(db.templates);
    setSettings(db.school_settings);
    
    // Gunakan siswa pertama dari database untuk preview riil
    if (db.students && db.students.length > 0) {
      setPreviewStudent(db.students[0]);
    } else {
      // Data dummy fallback
      setPreviewStudent({
        id: 'demo-1',
        name: 'SIMULASI NAMA SISWA',
        nis: '20210001',
        nisn: '0059876543',
        class: 'XII',
        major: 'TEKNIK KOMPUTER & JARINGAN',
        school_year: '2024/2025',
        photo_url: 'https://picsum.photos/seed/student-demo/300/400',
        status: 'Aktif',
        valid_until: '2025-06-30',
        card_code: 'ED-SYNC-DEMO-01'
      });
    }
  };

  useEffect(() => {
    refreshData();
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editingTemplate) {
      try {
        const parsed = JSON.parse(editingTemplate.config_json);
        setLocalConfig({
          front: { ...DEFAULT_CONFIG.front, ...parsed.front },
          back: { ...DEFAULT_CONFIG.back, ...parsed.back }
        });
      } catch (e) {
        setLocalConfig(DEFAULT_CONFIG);
      }
    }
  }, [editingTemplate]);

  const handleAddTemplate = () => {
    if (!newTemplateName.trim()) {
      toast({ title: "Gagal", description: "Nama template wajib diisi.", variant: "destructive" });
      return;
    }
    const db = getDB();
    const newTemplate: CardTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTemplateName,
      type: newTemplateType,
      config_json: JSON.stringify(DEFAULT_CONFIG),
      is_active: false,
      preview_color: 'bg-slate-500'
    };
    db.templates.push(newTemplate);
    saveDB(db);
    setTemplates([...db.templates]);
    setIsAddOpen(false);
    setNewTemplateName('');
    toast({ title: "Template Ditambahkan", description: "Varian desain baru telah dibuat." });
  };

  const handleToggleActive = (id: string) => {
    const db = getDB();
    const template = db.templates.find(t => t.id === id);
    if (!template) return;
    db.templates = db.templates.map(t => {
      if (t.type === template.type) return { ...t, is_active: t.id === id };
      return t;
    });
    saveDB(db);
    setTemplates(db.templates);
    toast({ title: "Template Aktif", description: `Template ${template.name} kini digunakan.` });
  };

  const handleDeleteConfirm = () => {
    if (!templateToDelete) return;
    const db = getDB();
    db.templates = db.templates.filter(t => t.id !== templateToDelete);
    saveDB(db);
    setTemplates(db.templates);
    setTemplateToDelete(null);
    toast({ title: "Dihapus", description: "Template telah dihapus." });
  };

  const openConfig = (template: CardTemplate) => {
    setEditingTemplate(template);
    setIsConfigOpen(true);
  };

  const handleSaveConfig = () => {
    if (!editingTemplate) return;
    const db = getDB();
    db.templates = db.templates.map(t => 
      t.id === editingTemplate.id ? { ...t, config_json: JSON.stringify(localConfig) } : t
    );
    saveDB(db);
    setTemplates(db.templates);
    setIsConfigOpen(false);
    toast({ title: "Konfigurasi Disimpan", description: "Perubahan visual telah diperbarui." });
  };

  if (!isMounted || !settings) return (
    <div className="h-full flex items-center justify-center">
       <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary tracking-tighter uppercase">Template Desain</h1>
          <p className="text-muted-foreground font-medium">Kustomisasi desain kartu berbasis data riil.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} className="gap-2 h-10 px-6 rounded-xl font-bold uppercase text-[10px]">
            <RotateCcw className="h-4 w-4" /> Refresh
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-xl shadow-primary/20 h-10 px-8 rounded-xl font-black uppercase text-[10px]">
                <Plus className="h-4 w-4" /> Template Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem]">
              <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tight">Varian Desain Baru</DialogTitle></DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nama Template</Label>
                  <Input placeholder="Misal: Blue Modern" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipe Kartu</Label>
                  <Select value={newTemplateType} onValueChange={(v: any) => setNewTemplateType(v)}>
                    <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT_CARD">Kartu Pelajar</SelectItem>
                      <SelectItem value="EXAM_CARD">Kartu Ujian</SelectItem>
                      <SelectItem value="ID_CARD">ID Card Umum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAddTemplate} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">BUAT TEMPLATE</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className={cn(
            "overflow-hidden border-4 transition-all group relative flex flex-col rounded-[2.5rem] shadow-sm",
            template.is_active ? "border-primary bg-primary/5" : "border-transparent"
          )}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div className={cn("p-3 rounded-2xl text-white shadow-lg", template.preview_color || 'bg-slate-400')}>
                  <Layout className="h-5 w-5" />
                </div>
                <div className="flex gap-2">
                   {template.is_active ? (
                     <Badge className="bg-primary px-4 py-1 font-black text-[9px] rounded-full">DIGUNAKAN</Badge>
                   ) : (
                     <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive opacity-30 group-hover:opacity-100 transition-opacity" onClick={() => setTemplateToDelete(template.id)}>
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   )}
                </div>
              </div>
              <CardTitle className="mt-4 font-black uppercase tracking-tight">{template.name}</CardTitle>
              <CardDescription className="uppercase text-[9px] font-black tracking-[0.2em] text-muted-foreground">{template.type.replace('_', ' ')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6">
              <div className="aspect-[4/5] bg-slate-100 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden group">
                <div className="scale-[0.55] transition-transform group-hover:scale-[0.6] duration-500">
                   {template.type === 'STUDENT_CARD' && previewStudent && settings && (
                     <StudentCardVisual student={previewStudent} settings={settings} template={template} />
                   )}
                   {template.type === 'EXAM_CARD' && previewStudent && settings && (
                     <ExamCardVisual student={previewStudent} settings={settings} template={template} />
                   )}
                   {template.type === 'ID_CARD' && previewStudent && settings && (
                     <IdCardVisual student={previewStudent} settings={settings} side="front" template={template} />
                   )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest" variant={template.is_active ? 'secondary' : 'default'} onClick={() => handleToggleActive(template.id)} disabled={template.is_active}>
                  {template.is_active ? 'AKTIF' : 'Gunakan'}
                </Button>
                <Button variant="outline" className="h-12 w-12 rounded-xl border-2" onClick={() => openConfig(template)}>
                  <Palette className="h-5 w-5 text-primary" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!templateToDelete} onOpenChange={o => !o && setTemplateToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Hapus Desain?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">Seluruh kustomisasi warna dan font pada template ini akan hilang secara permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px]">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-white rounded-xl font-bold uppercase text-[10px]">YA, HAPUS</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-6xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Editor Visual: {editingTemplate?.name}</h2>
                  <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Kustomisasi Warna & Font Berdasarkan Data Riil</p>
               </div>
               <Button variant="ghost" size="sm" onClick={() => setLocalConfig(DEFAULT_CONFIG)} className="gap-2 text-white/40 hover:text-white hover:bg-white/10 h-10 px-6 rounded-full font-black text-[10px] uppercase tracking-widest">
                 <RotateCcw className="h-4 w-4" /> Reset
               </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-10 space-y-8 bg-white border-r max-h-[70vh] overflow-y-auto scrollbar-thin">
              <Tabs defaultValue="front">
                <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 p-1 rounded-2xl">
                  <TabsTrigger value="front" className="rounded-xl font-black text-[10px] uppercase">Sisi Depan</TabsTrigger>
                  <TabsTrigger value="back" className="rounded-xl font-black text-[10px] uppercase">Sisi Belakang</TabsTrigger>
                </TabsList>
                {['front', 'back'].map(side => (
                  <TabsContent key={side} value={side} className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                         <Type className="h-3 w-3" /> Tipografi Utama
                      </Label>
                      <Select value={localConfig[side].fontFamily} onValueChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], fontFamily: v}})}>
                        <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value} style={{fontFamily: f.value}}>{f.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-4">
                       <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Palet Warna Kartu</Label>
                       <div className="grid grid-cols-2 gap-4">
                          <ColorField label="Header" value={localConfig[side].headerBg} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], headerBg: v}})} />
                          <ColorField label="Body" value={localConfig[side].bodyBg} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], bodyBg: v}})} />
                          <ColorField label="Footer" value={localConfig[side].footerBg} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], footerBg: v}})} />
                          <ColorField label="Teks" value={localConfig[side].textColor} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], textColor: v}})} />
                       </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="bg-slate-100 flex flex-col items-center justify-center p-12 border-l gap-10">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4">Live Preview (Data Riil)</div>
              <div className="flex flex-col gap-10 scale-[0.8] origin-center">
                 {editingTemplate?.type === 'STUDENT_CARD' && previewStudent && settings && (
                   <>
                     <StudentCardVisual student={previewStudent} settings={settings} side="front" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                     <StudentCardVisual student={previewStudent} settings={settings} side="back" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                   </>
                 )}
                 {editingTemplate?.type === 'EXAM_CARD' && previewStudent && settings && (
                   <>
                     <ExamCardVisual student={previewStudent} settings={settings} side="front" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                     <ExamCardVisual student={previewStudent} settings={settings} side="back" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                   </>
                 )}
                 {editingTemplate?.type === 'ID_CARD' && previewStudent && settings && (
                   <>
                     <IdCardVisual student={previewStudent} settings={settings} side="front" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                     <IdCardVisual student={previewStudent} settings={settings} side="back" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                   </>
                 )}
              </div>
            </div>
          </div>
          <div className="p-8 bg-white border-t flex justify-end">
             <Button onClick={handleSaveConfig} className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"><Save className="h-5 w-5 mr-3" /> SIMPAN DESAIN</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="bg-slate-50 p-3 rounded-2xl border-2 border-transparent flex items-center justify-between gap-3 hover:border-slate-200 transition-all">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm border-2 border-white ring-1 ring-slate-200">
         <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-[-4px] w-[150%] h-[150%] cursor-pointer border-none" />
      </div>
    </div>
  );
}
