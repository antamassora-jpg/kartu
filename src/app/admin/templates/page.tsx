
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
  X,
  ArrowRightLeft,
  Move,
  Maximize2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Type as FontIcon,
  PenTool
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
import { Slider } from '@/components/ui/slider';
import Image from 'next/image';

const FONT_OPTIONS = [
  { name: 'Inter (Default)', value: 'Inter, sans-serif' },
  { name: 'Oswald (Bold Display)', value: 'Oswald, sans-serif' },
  { name: 'Montserrat (Modern)', value: 'Montserrat, sans-serif' },
  { name: 'Playfair Display (Elegant)', value: 'Playfair Display, serif' },
  { name: 'Roboto Mono (Technical)', value: 'Roboto Mono, monospace' },
];

const DEFAULT_ELEMENTS = {
  photo: { x: 15, y: 70, w: 60, h: 80 },
  qr: { x: 15, y: 155, w: 48, h: 48 },
  info: { x: 90, y: 70, align: 'left', fontSize: 10, width: 180 },
  sigBlock: { x: 240, y: 160, scale: 0.75 }
};

const DEFAULT_CONFIG = {
  front: { 
    headerBg: '#2E50B8', bodyBg: '#ffffff', footerBg: '#4FBFDD', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif',
    elements: { ...DEFAULT_ELEMENTS }
  },
  back: { 
    headerBg: '#2E50B8', bodyBg: '#ffffff', footerBg: '#4FBFDD', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif',
    elements: { ...DEFAULT_ELEMENTS, photo: { ...DEFAULT_ELEMENTS.photo, x: 15 }, info: { ...DEFAULT_ELEMENTS.info, x: 90 }, qr: { ...DEFAULT_ELEMENTS.qr, x: 275 } }
  }
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
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<TemplateType>('STUDENT_CARD');
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      preview_color: newTemplateType === 'STUDENT_CARD' ? 'bg-blue-600' : (newTemplateType === 'EXAM_CARD' ? 'bg-orange-500' : 'bg-emerald-800')
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
    toast({ title: "Visual Disimpan", description: "Kustomisasi warna, font, dan posisi elemen telah diperbarui." });
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLocalConfig({
        ...localConfig,
        [activeSide]: {
          ...localConfig[activeSide],
          bgImage: result
        }
      });
      toast({ title: "Background Dimuat", description: "Gambar latar belakang siap diaplikasikan." });
    };
    reader.readAsDataURL(file);
  };

  const updateElement = (key: string, value: any) => {
    setLocalConfig({
      ...localConfig,
      [activeSide]: {
        ...localConfig[activeSide],
        elements: {
          ...localConfig[activeSide].elements,
          [key]: { ...localConfig[activeSide].elements[key], ...value }
        }
      }
    });
  };

  if (!isMounted || !settings) return (
    <div className="h-full flex items-center justify-center py-40">
       <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  const currentTemplateWithLocalConfig = editingTemplate ? { ...editingTemplate, config_json: JSON.stringify(localConfig) } : null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary tracking-tighter uppercase">Template Desain</h1>
          <p className="text-muted-foreground font-medium">Visual Editor dengan fitur Drag & Drop tata letak identitas.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={refreshData} className="gap-2 h-11 px-6 rounded-2xl font-bold uppercase text-[10px] border-2">
            <RotateCcw className="h-4 w-4" /> REFRESH SUMBER DATA
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-2xl shadow-primary/20 h-11 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white">
            <Plus className="h-4 w-4" /> BUAT VARIAN DESAIN
          </Button>
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
                   {!template.is_active && (
                     <Button variant="ghost" size="icon" className="h-11 w-11 text-destructive hover:bg-destructive/10 opacity-30 group-hover:opacity-100 transition-opacity" onClick={() => setTemplateToDelete(template.id)}>
                       <Trash2 className="h-5 w-5" />
                     </Button>
                   )}
                   {template.is_active && <Badge className="bg-primary text-white uppercase text-[9px] px-4 rounded-full">AKTIF</Badge>}
                </div>
              </div>
              <CardTitle className="mt-6 font-black uppercase tracking-tight text-xl">{template.name}</CardTitle>
              <CardDescription className="uppercase text-[9px] font-black tracking-[0.3em] text-muted-foreground mt-1">
                {template.type.replace('_', ' ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-8 p-8 pt-0">
              {/* Dual Preview Container (Front & Back) */}
              <div className={cn(
                "bg-slate-50 rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden relative p-4 gap-2",
                template.type === 'ID_CARD' ? "aspect-[1/1.8]" : "aspect-[1/1.3]"
              )}>
                {/* Front Preview */}
                <div className="flex flex-col items-center w-full">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Tampak Depan</span>
                  <div className="transition-transform scale-[0.35] origin-top h-auto mb-[-125px]">
                     {template.type === 'STUDENT_CARD' && previewStudent && <StudentCardVisual student={previewStudent} settings={settings} side="front" template={template} />}
                     {template.type === 'EXAM_CARD' && previewStudent && <ExamCardVisual student={previewStudent} settings={settings} side="front" template={template} />}
                     {template.type === 'ID_CARD' && previewStudent && <IdCardVisual student={previewStudent} settings={settings} side="front" template={template} />}
                  </div>
                </div>
                
                {/* Back Preview */}
                <div className="flex flex-col items-center w-full pt-4 border-t border-slate-200/50">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Tampak Belakang</span>
                  <div className="transition-transform scale-[0.35] origin-top h-auto mb-[-125px]">
                     {template.type === 'STUDENT_CARD' && previewStudent && <StudentCardVisual student={previewStudent} settings={settings} side="back" template={template} />}
                     {template.type === 'EXAM_CARD' && previewStudent && <ExamCardVisual student={previewStudent} settings={settings} side="back" template={template} />}
                     {template.type === 'ID_CARD' && previewStudent && <IdCardVisual student={previewStudent} settings={settings} side="back" template={template} />}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg" onClick={() => handleToggleActive(template.id)} disabled={template.is_active}>
                  {template.is_active ? 'AKTIF' : 'AKTIFKAN'}
                </Button>
                <Button variant="outline" className="h-14 w-14 rounded-2xl border-2" onClick={() => openConfig(template)}>
                  <Palette className="h-6 w-6 text-primary" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="!max-w-[95vw] md:!max-w-7xl h-[95vh] p-0 overflow-hidden flex flex-col rounded-[2.5rem] border-none shadow-2xl bg-white">
          <DialogHeader className="sr-only">
            <DialogTitle>Visual Editor: {editingTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="shrink-0 bg-slate-900 p-6 md:p-8 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Visual Editor & Layout Hub</h2>
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.4em] mt-1">Sesuaikan Warna, Font, dan Posisi Elemen Secara Presisi</p>
               </div>
               <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setLocalConfig(DEFAULT_CONFIG)} className="text-white/40 hover:text-white h-10 px-6 rounded-full font-black text-[10px] uppercase border border-white/10">
                    <RotateCcw className="h-3.5 w-3.5 mr-2" /> RESET LAYOUT
                  </Button>
                  <Button onClick={() => setIsConfigOpen(false)} variant="ghost" size="icon" className="text-white/40 hover:text-white"><X className="h-5 w-5" /></Button>
               </div>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Panel Kontrol Kiri */}
            <div className="w-full md:w-1/3 bg-white border-r overflow-y-auto p-6 md:p-10 space-y-10 scrollbar-thin">
              <Tabs defaultValue="front" onValueChange={(v: any) => setActiveSide(v)}>
                <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 p-1 rounded-2xl">
                  <TabsTrigger value="front" className="rounded-xl font-black text-[10px] uppercase">TAMPAK DEPAN</TabsTrigger>
                  <TabsTrigger value="back" className="rounded-xl font-black text-[10px] uppercase">TAMPAK BELAKANG</TabsTrigger>
                </TabsList>

                {['front', 'back'].map(side => (
                  <TabsContent key={side} value={side} className="space-y-10 pt-8">
                    {/* Estetika */}
                    <div className="space-y-6">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                         <Palette className="h-3 w-3" /> Estetika & Visual
                      </Label>
                      <div className="space-y-4">
                        <Label className="text-[9px] font-bold uppercase text-muted-foreground">Tipografi Utama</Label>
                        <Select value={localConfig[side].fontFamily} onValueChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], fontFamily: v}})}>
                          <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value} style={{fontFamily: f.value}}>{f.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <ColorField label="Header" value={localConfig[side].headerBg} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], headerBg: v}})} />
                        <ColorField label="Body" value={localConfig[side].bodyBg} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], bodyBg: v}})} />
                        <ColorField label="Footer" value={localConfig[side].footerBg} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], footerBg: v}})} />
                        <ColorField label="Teks" value={localConfig[side].textColor} onChange={v => setLocalConfig({...localConfig, [side]: {...localConfig[side], textColor: v}})} />
                      </div>
                    </div>

                    {/* Dimensi & Ukuran */}
                    <div className="space-y-6">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                         <Maximize2 className="h-3 w-3" /> Dimensi & Ukuran
                      </Label>
                      <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="space-y-3">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span>Lebar Foto Siswa</span>
                            <span className="text-primary font-bold">{localConfig[side].elements.photo.w}px</span>
                          </div>
                          <Slider value={[localConfig[side].elements.photo.w]} min={40} max={120} step={1} onValueChange={([v]) => updateElement('photo', { w: v, h: v * 1.33 })} />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span>Ukuran QR Code</span>
                            <span className="text-primary font-bold">{localConfig[side].elements.qr.w}px</span>
                          </div>
                          <Slider value={[localConfig[side].elements.qr.w]} min={30} max={100} step={1} onValueChange={([v]) => updateElement('qr', { w: v, h: v })} />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span>Lebar Blok Identitas</span>
                            <span className="text-primary font-bold">{localConfig[side].elements.info.width}px</span>
                          </div>
                          <Slider value={[localConfig[side].elements.info.width]} min={100} max={250} step={1} onValueChange={([v]) => updateElement('info', { width: v })} />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span>Ukuran Font Teks</span>
                            <span className="text-primary font-bold">{localConfig[side].elements.info.fontSize}px</span>
                          </div>
                          <Slider value={[localConfig[side].elements.info.fontSize]} min={6} max={16} step={0.5} onValueChange={([v]) => updateElement('info', { fontSize: v })} />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[9px] font-black uppercase">
                            <span>Skala Tanda Tangan & Stempel</span>
                            <span className="text-primary font-bold">{Math.round((localConfig[side].elements.sigBlock.scale || 0.75) * 100)}%</span>
                          </div>
                          <Slider value={[(localConfig[side].elements.sigBlock.scale || 0.75) * 100]} min={40} max={120} step={1} onValueChange={([v]) => updateElement('sigBlock', { scale: v / 100 })} />
                        </div>
                      </div>
                    </div>

                    {/* Paragraf & Perataan */}
                    <div className="space-y-6">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                         <AlignCenter className="h-3 w-3" /> Perataan Identitas
                      </Label>
                      <div className="flex gap-2">
                        <Button variant={localConfig[side].elements.info.align === 'left' ? 'default' : 'outline'} className="flex-1 rounded-xl h-12" onClick={() => updateElement('info', { align: 'left' })}>
                          <AlignLeft className="h-4 w-4 mr-2" /> KIRI
                        </Button>
                        <Button variant={localConfig[side].elements.info.align === 'center' ? 'default' : 'outline'} className="flex-1 rounded-xl h-12" onClick={() => updateElement('info', { align: 'center' })}>
                          <AlignCenter className="h-4 w-4 mr-2" /> TENGAH
                        </Button>
                        <Button variant={localConfig[side].elements.info.align === 'right' ? 'default' : 'outline'} className="flex-1 rounded-xl h-12" onClick={() => updateElement('info', { align: 'right' })}>
                          <AlignRight className="h-4 w-4 mr-2" /> KANAN
                        </Button>
                      </div>
                    </div>

                    {/* Background */}
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                         <ImageIcon className="h-3 w-3" /> Background Sisi Ini
                      </Label>
                      <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
                         {localConfig[side].bgImage ? (
                           <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md">
                              <Image src={localConfig[side].bgImage} alt="Bg" fill className="object-cover" unoptimized />
                              <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => setLocalConfig({...localConfig, [side]: {...localConfig[side], bgImage: ''}})}><X className="h-4 w-4" /></Button>
                           </div>
                         ) : (
                           <Button variant="outline" className="h-12 w-full rounded-xl gap-3 border-2" onClick={() => fileInputRef.current?.click()}>
                             <Upload className="h-4 w-4" /> UNGGAH LATAR
                           </Button>
                         )}
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Area Pratinjau Kanan (Interactive Editor) */}
            <div className="flex-1 bg-slate-100 overflow-hidden flex flex-col items-center justify-center p-10 relative">
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                  <Badge className="bg-white/80 text-primary border-primary/20 backdrop-blur-md px-6 py-2 rounded-full shadow-xl animate-pulse">
                    <Move className="h-3 w-3 mr-2" /> MODE EDITOR: DRAG UNTUK PINDAHKAN ELEMEN
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Klik dan geser elemen di dalam kartu</span>
              </div>

              <div className="relative scale-150 origin-center transition-all duration-500 hover:scale-[1.55]">
                <InteractiveLayoutWrapper 
                  config={localConfig[activeSide]} 
                  updateConfig={(elements: any) => setLocalConfig({ ...localConfig, [activeSide]: { ...localConfig[activeSide], elements } })}
                >
                  {editingTemplate?.type === 'STUDENT_CARD' && previewStudent && (
                    <StudentCardVisual student={previewStudent} settings={settings!} side={activeSide} template={currentTemplateWithLocalConfig} />
                  )}
                  {editingTemplate?.type === 'EXAM_CARD' && previewStudent && (
                    <ExamCardVisual student={previewStudent} settings={settings!} side={activeSide} template={currentTemplateWithLocalConfig} />
                  )}
                  {editingTemplate?.type === 'ID_CARD' && previewStudent && (
                    <IdCardVisual student={previewStudent} settings={settings!} side={activeSide} template={currentTemplateWithLocalConfig} />
                  )}
                </InteractiveLayoutWrapper>
              </div>

              {/* Petunjuk Editor */}
              <div className="mt-20 max-w-md bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100">
                 <div className="flex gap-4 items-start">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary"><FontIcon className="h-5 w-5" /></div>
                    <div>
                       <h4 className="text-xs font-black uppercase text-slate-800 tracking-tight">Kustomisasi Tata Letak</h4>
                       <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                         Geser elemen langsung pada kartu untuk menentukan posisi terbaik. Gunakan slider di panel kiri untuk mengubah ukuran foto, barcode, teks, dan skala legalitas secara presisi.
                       </p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 p-6 bg-white border-t flex justify-end gap-3 shadow-2xl">
             <Button variant="ghost" onClick={() => setIsConfigOpen(false)} className="h-12 px-8 rounded-xl font-bold uppercase text-[10px]">BATAL</Button>
             <Button onClick={handleSaveConfig} className="h-12 px-10 rounded-xl font-black uppercase tracking-widest shadow-xl text-white">
               <Save className="h-4 w-4 mr-2" /> SIMPAN DESAIN
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-md">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tight">Tambah Varian Baru</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Label Nama Template</Label>
              <Input placeholder="Misal: Modern Red Premium" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} className="h-14 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pilih Jenis Kartu</Label>
              <Select value={newTemplateType} onValueChange={(v: any) => setNewTemplateType(v)}>
                <SelectTrigger className="h-14 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT_CARD">Kartu Pelajar Digital</SelectItem>
                  <SelectItem value="EXAM_CARD">Kartu Tanda Peserta Ujian</SelectItem>
                  <SelectItem value="ID_CARD">ID Card Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddTemplate} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest">DAFTARKAN TEMPLATE</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!templateToDelete} onOpenChange={o => !o && setTemplateToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-10">
          <AlertDialogHeader><AlertDialogTitle className="text-2xl font-black">Hapus Template?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 px-8">BATAL</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-white rounded-2xl h-12 px-8">YA, HAPUS</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="bg-slate-50 p-3 rounded-xl border-2 border-slate-100 flex items-center justify-between gap-3 hover:border-primary/20 transition-all">
      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <div className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-white ring-1 ring-slate-200">
         <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-[-6px] w-[160%] h-[160%] cursor-pointer border-none p-0 bg-transparent" />
      </div>
    </div>
  );
}

function InteractiveLayoutWrapper({ children, config, updateConfig }: { children: React.ReactNode, config: any, updateConfig: (els: any) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(id);
    const element = config.elements[id];
    setOffset({ x: e.clientX - element.x, y: e.clientY - element.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;
    updateConfig({
      ...config.elements,
      [dragging]: { ...config.elements[dragging], x: Math.round(newX), y: Math.round(newY) }
    });
  };

  const handleMouseUp = () => setDragging(null);

  const els = config.elements;

  return (
    <div 
      className="relative cursor-default select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      ref={containerRef}
    >
      <div className="relative z-10 opacity-100 pointer-events-auto">
        {children}
      </div>

      {/* Layer Interaktif untuk Dragging */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        {/* Photo Handle */}
        <div 
          className={cn("absolute border-2 border-primary bg-primary/10 cursor-move pointer-events-auto group", dragging === 'photo' && 'border-dashed border-4')}
          style={{ left: els.photo.x, top: els.photo.y, width: els.photo.w, height: els.photo.h }}
          onMouseDown={(e) => handleMouseDown('photo', e)}
        >
           <div className="hidden group-hover:block absolute -top-6 left-0 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Foto Siswa</div>
        </div>

        {/* QR Handle */}
        <div 
          className={cn("absolute border-2 border-primary bg-primary/10 cursor-move pointer-events-auto group", dragging === 'qr' && 'border-dashed border-4')}
          style={{ left: els.qr.x, top: els.qr.y, width: els.qr.w, height: els.qr.h }}
          onMouseDown={(e) => handleMouseDown('qr', e)}
        >
           <div className="hidden group-hover:block absolute -top-6 left-0 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">QR Code</div>
        </div>

        {/* Info Handle */}
        <div 
          className={cn("absolute border-2 border-secondary bg-secondary/10 cursor-move pointer-events-auto group", dragging === 'info' && 'border-dashed border-4')}
          style={{ left: els.info.x, top: els.info.y, width: els.info.width || 180, height: 80 }}
          onMouseDown={(e) => handleMouseDown('info', e)}
        >
           <div className="hidden group-hover:block absolute -top-6 left-0 bg-secondary text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Blok Identitas</div>
        </div>

        {/* Signature Handle */}
        <div 
          className={cn("absolute border-2 border-orange-500 bg-orange-500/10 cursor-move pointer-events-auto group", dragging === 'sigBlock' && 'border-dashed border-4')}
          style={{ 
            left: els.sigBlock.x, 
            top: els.sigBlock.y, 
            width: 100, 
            height: 60,
            transform: `scale(${els.sigBlock.scale || 0.75})`,
            transformOrigin: 'top left'
          }}
          onMouseDown={(e) => handleMouseDown('sigBlock', e)}
        >
           <div className="hidden group-hover:block absolute -top-6 left-0 bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Legalitas</div>
        </div>
      </div>
    </div>
  );
}
