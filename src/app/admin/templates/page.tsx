
"use client";

import { useState, useEffect, useRef } from 'react';
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
  Type,
  Eye,
  Image as ImageIcon,
  Upload,
  X
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
import Image from 'next/image';

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSideForUpload, setCurrentSideForUpload] = useState<'front' | 'back'>('front');

  const refreshData = () => {
    const db = getDB();
    setTemplates(db.templates);
    setSettings(db.school_settings);
    
    if (db.students && db.students.length > 0) {
      setPreviewStudent(db.students[0]);
    } else {
      setPreviewStudent({
        id: 'demo-1',
        name: 'SIMULASI NAMA SISWA LENGKAP',
        nis: '20240101',
        nisn: '005987654321',
        class: 'XII',
        major: 'TEKNIK KOMPUTER & JARINGAN',
        school_year: '2024/2025',
        photo_url: 'https://picsum.photos/seed/student-demo/400/500',
        status: 'Aktif',
        valid_until: '30 Juni 2025',
        card_code: 'VERIFY-DEMO-01'
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
    toast({ title: "Template Berhasil Dibuat", description: "Varian desain baru telah ditambahkan." });
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
    toast({ title: "Template Diaktifkan", description: `Sekarang menggunakan desain ${template.name}.` });
  };

  const handleDeleteConfirm = () => {
    if (!templateToDelete) return;
    const db = getDB();
    db.templates = db.templates.filter(t => t.id !== templateToDelete);
    saveDB(db);
    setTemplates(db.templates);
    setTemplateToDelete(null);
    toast({ title: "Template Dihapus", description: "Data template desain telah dibersihkan." });
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
    toast({ title: "Visual Disimpan", description: "Kustomisasi warna, font, dan background telah diperbarui." });
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLocalConfig({
        ...localConfig,
        [currentSideForUpload]: {
          ...localConfig[currentSideForUpload],
          bgImage: result
        }
      });
      toast({ title: "Background Dimuat", description: "Gambar latar belakang siap diaplikasikan." });
    };
    reader.readAsDataURL(file);
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
          <p className="text-muted-foreground font-medium">Kustomisasi aspek visual kartu menggunakan data dari Settings.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={refreshData} className="gap-2 h-11 px-6 rounded-2xl font-bold uppercase text-[10px] border-2">
            <RotateCcw className="h-4 w-4" /> REFRESH DATA
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-2xl shadow-primary/20 h-11 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                <Plus className="h-4 w-4" /> BUAT TEMPLATE BARU
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-10">
              <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tight">Tambah Varian Desain</DialogTitle></DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Label Nama Template</Label>
                  <Input placeholder="Misal: Modern Red Premium" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} className="h-14 rounded-2xl border-2" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pilih Jenis Kartu</Label>
                  <Select value={newTemplateType} onValueChange={(v: any) => setNewTemplateType(v)}>
                    <SelectTrigger className="h-14 rounded-2xl border-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT_CARD">Kartu Pelajar Digital</SelectItem>
                      <SelectItem value="EXAM_CARD">Kartu Tanda Peserta Ujian</SelectItem>
                      <SelectItem value="ID_CARD">ID Card Umum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAddTemplate} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl">DAFTARKAN TEMPLATE</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((template) => (
          <Card key={template.id} className={cn(
            "overflow-hidden border-4 transition-all group relative flex flex-col rounded-[3rem] shadow-sm hover:shadow-2xl hover:scale-[1.01]",
            template.is_active ? "border-primary bg-primary/5" : "border-transparent bg-white"
          )}>
            <CardHeader className="pb-4 p-8">
              <div className="flex justify-between items-center">
                <div className={cn("p-4 rounded-2xl text-white shadow-lg", template.preview_color || 'bg-slate-400')}>
                  <Layout className="h-6 w-6" />
                </div>
                <div className="flex gap-2">
                   {template.is_active ? (
                     <Badge className="bg-primary px-5 py-1.5 font-black text-[10px] rounded-full uppercase tracking-widest">AKTIF</Badge>
                   ) : (
                     <Button variant="ghost" size="icon" className="h-11 w-11 text-destructive hover:bg-destructive/10 opacity-30 group-hover:opacity-100 transition-opacity" onClick={() => setTemplateToDelete(template.id)}>
                       <Trash2 className="h-5 w-5" />
                     </Button>
                   )}
                </div>
              </div>
              <CardTitle className="mt-6 font-black uppercase tracking-tight text-xl">{template.name}</CardTitle>
              <CardDescription className="uppercase text-[9px] font-black tracking-[0.3em] text-muted-foreground mt-1">{template.type.replace('_', ' ')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-8 p-8 pt-0">
              <div className="aspect-[4/5] bg-slate-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden relative group/visual">
                <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/visual:opacity-100 transition-opacity flex items-center justify-center z-20">
                    <Badge className="bg-white text-slate-900 gap-2"><Eye className="h-3 w-3" /> Live Preview</Badge>
                </div>
                <div className="scale-[0.52] transition-transform group-hover/visual:scale-[0.58] duration-700">
                   {template.type === 'STUDENT_CARD' && previewStudent && (
                     <StudentCardVisual student={previewStudent} settings={settings} template={template} />
                   )}
                   {template.type === 'EXAM_CARD' && previewStudent && (
                     <ExamCardVisual student={previewStudent} settings={settings} template={template} />
                   )}
                   {template.type === 'ID_CARD' && previewStudent && (
                     <IdCardVisual student={previewStudent} settings={settings} side="front" template={template} />
                   )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg" variant={template.is_active ? 'secondary' : 'default'} onClick={() => handleToggleActive(template.id)} disabled={template.is_active}>
                  {template.is_active ? 'SEDANG DIGUNAKAN' : 'AKTIFKAN DESAIN'}
                </Button>
                <Button variant="outline" className="h-14 w-14 rounded-2xl border-2 flex items-center justify-center" onClick={() => openConfig(template)}>
                  <Palette className="h-6 w-6 text-primary" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!templateToDelete} onOpenChange={o => !o && setTemplateToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">Hapus Template?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-slate-500">Konfigurasi visual pada template ini akan hilang permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 px-8 font-bold uppercase text-[10px] tracking-widest border-2">BATAL</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-white rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest">YA, HAPUS PERMANEN</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-7xl rounded-[4rem] p-0 overflow-hidden border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)]">
          <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
               <div className="relative z-10">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Visual Editor: {editingTemplate?.name}</h2>
                  <p className="text-xs text-white/50 font-black uppercase tracking-[0.4em] mt-1">Customization • Template Settings</p>
               </div>
               <Button variant="ghost" size="sm" onClick={() => setLocalConfig(DEFAULT_CONFIG)} className="gap-2 text-white/40 hover:text-white hover:bg-white/10 h-12 px-8 rounded-full font-black text-[10px] uppercase tracking-widest border border-white/10">
                 <RotateCcw className="h-4 w-4" /> RESET DESAIN
               </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-12 space-y-10 bg-white border-r max-h-[72vh] overflow-y-auto scrollbar-none">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
              
              <Tabs defaultValue="front">
                <TabsList className="grid w-full grid-cols-2 h-16 bg-slate-100 p-1.5 rounded-[2rem]">
                  <TabsTrigger value="front" className="rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">TAMPAK DEPAN</TabsTrigger>
                  <TabsTrigger value="back" className="rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">TAMPAK BELAKANG</TabsTrigger>
                </TabsList>
                {['front', 'back'].map(side => (
                  <TabsContent key={side} value={side} className="space-y-8 pt-10">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                         <Type className="h-3 w-3" /> Pemilihan Tipografi
                      </Label>
                      <Select value={localConfig[side].fontFamily} onValueChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], fontFamily: v}})}>
                        <SelectTrigger className="h-14 rounded-2xl border-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value} style={{fontFamily: f.value}}>{f.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                         <ImageIcon className="h-3 w-3" /> Background Khusus
                      </Label>
                      <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
                         {localConfig[side].bgImage ? (
                           <div className="relative w-full aspect-video rounded-xl overflow-hidden border-4 border-white shadow-lg">
                              <Image src={localConfig[side].bgImage} alt="Background" fill className="object-cover" unoptimized />
                              <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg" onClick={() => setLocalConfig({...localConfig, [side]: {...localConfig[side], bgImage: ''}})}>
                                <X className="h-4 w-4" />
                              </Button>
                           </div>
                         ) : (
                           <Button variant="outline" className="h-14 w-full rounded-2xl gap-3 border-2" onClick={() => {
                             setCurrentSideForUpload(side as 'front' | 'back');
                             fileInputRef.current?.click();
                           }}>
                             <Upload className="h-5 w-5" /> UNGGAH BACKGROUND
                           </Button>
                         )}
                         <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Rekomendasi: 1011x638 px (landscape)</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                       <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Konfigurasi Warna Palet</Label>
                       <div className="grid grid-cols-2 gap-4">
                          <ColorField label="Background Header" value={localConfig[side].headerBg} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], headerBg: v}})} />
                          <ColorField label="Background Body" value={localConfig[side].bodyBg} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], bodyBg: v}})} />
                          <ColorField label="Warna Aksen" value={localConfig[side].footerBg} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], footerBg: v}})} />
                          <ColorField label="Warna Teks Utama" value={localConfig[side].textColor} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], textColor: v}})} />
                       </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="bg-slate-100/50 flex flex-col items-center justify-center p-16 border-l gap-12 relative">
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-300" />
                  <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.6em]">Live Visual Preview</span>
              </div>
              <div className="flex flex-col gap-12 scale-[0.88] origin-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] rounded-3xl p-6 bg-white/50">
                 {editingTemplate?.type === 'STUDENT_CARD' && previewStudent && (
                   <>
                     <StudentCardVisual student={previewStudent} settings={settings} side="front" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                     <StudentCardVisual student={previewStudent} settings={settings} side="back" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                   </>
                 )}
                 {editingTemplate?.type === 'EXAM_CARD' && previewStudent && (
                   <>
                     <ExamCardVisual student={previewStudent} settings={settings} side="front" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                     <ExamCardVisual student={previewStudent} settings={settings} side="back" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                   </>
                 )}
                 {editingTemplate?.type === 'ID_CARD' && previewStudent && (
                   <>
                     <IdCardVisual student={previewStudent} settings={settings} side="front" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                     <IdCardVisual student={previewStudent} settings={settings} side="back" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                   </>
                 )}
              </div>
            </div>
          </div>
          <div className="p-10 bg-white border-t flex justify-end">
             <Button onClick={handleSaveConfig} className="h-16 px-14 rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"><Save className="h-6 w-6 mr-3" /> SIMPAN VISUAL KARTU</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 flex items-center justify-between gap-4 hover:border-primary/20 transition-all group">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors">{label}</span>
      <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-sm border-4 border-white ring-1 ring-slate-200">
         <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-[-6px] w-[160%] h-[160%] cursor-pointer border-none p-0 bg-transparent" />
      </div>
    </div>
  );
}
