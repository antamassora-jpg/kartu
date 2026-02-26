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
  CheckCircle2, 
  Save, 
  RotateCcw, 
  Upload, 
  Image as ImageIcon, 
  ChevronRight, 
  Type, 
  Plus, 
  Trash2, 
  AlertCircle
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
  DialogDescription,
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
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);
  const [localConfig, setLocalConfig] = useState<any>(DEFAULT_CONFIG);

  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<TemplateType>('STUDENT_CARD');
  
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Fungsi untuk memuat ulang data dari DB
  const refreshData = () => {
    const db = getDB();
    setTemplates(db.templates);
    setSettings(db.school_settings);
    
    if (db.students && db.students.length > 0) {
      setPreviewStudent(db.students[0]);
    } else {
      setPreviewStudent({
        id: 'mock',
        name: 'CONTOH NAMA SISWA',
        nis: '2021001',
        nisn: '0051234567',
        class: 'XII',
        major: 'TEKNIK KOMPUTER & JARINGAN',
        school_year: '2024/2025',
        photo_url: 'https://picsum.photos/seed/student-mock/300/400',
        status: 'Aktif',
        valid_until: '2025-06-30',
        card_code: 'ED-SYNC-001'
      });
    }
  };

  useEffect(() => {
    refreshData();
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
      toast({ title: "Gagal", description: "Nama template tidak boleh kosong.", variant: "destructive" });
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

    const updated = [...db.templates, newTemplate];
    db.templates = updated;
    saveDB(db);
    setTemplates(updated);
    setIsAddOpen(false);
    setNewTemplateName('');
    toast({ title: "Berhasil", description: "Template baru telah ditambahkan." });
  };

  const handleToggleActive = (id: string) => {
    const db = getDB();
    const template = db.templates.find(t => t.id === id);
    if (!template) return;

    const updated = db.templates.map(t => {
      if (t.type === template.type) {
        return { ...t, is_active: t.id === id };
      }
      return t;
    });
    
    db.templates = updated;
    saveDB(db);
    setTemplates(updated);
    toast({ title: "Template Diperbarui", description: `Template "${template.name}" sekarang aktif.` });
  };

  const handleDeleteConfirm = () => {
    if (!templateToDelete) return;
    
    const db = getDB();
    const updated = db.templates.filter(t => t.id !== templateToDelete);
    db.templates = updated;
    saveDB(db);
    setTemplates(updated);
    setTemplateToDelete(null);
    toast({ title: "Dihapus", description: "Template telah dihapus dari sistem." });
  };

  const openConfig = (template: CardTemplate) => {
    setEditingTemplate({ ...template });
    setIsConfigOpen(true);
  };

  const handleImageUpload = (side: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalConfig({
        ...localConfig,
        [side]: { ...localConfig[side], bgImage: reader.result as string }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleResetConfig = () => {
    setLocalConfig(DEFAULT_CONFIG);
    toast({ title: "Reset", description: "Konfigurasi dikembalikan ke pengaturan awal." });
  };

  const handleSaveConfig = () => {
    if (!editingTemplate) return;
    const db = getDB();
    const updatedTemplate = {
      ...editingTemplate,
      config_json: JSON.stringify(localConfig)
    };
    const updated = db.templates.map(t => t.id === editingTemplate.id ? updatedTemplate : t);
    db.templates = updated;
    saveDB(db);
    setTemplates(updated);
    setIsConfigOpen(false);
    toast({ title: "Tersimpan", description: `Desain ${editingTemplate.name} telah diperbarui.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Template Desain</h1>
          <p className="text-muted-foreground">Kustomisasi visual kartu menggunakan data asli dari Data Siswa & Settings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Refresh Data
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Buat Template Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Varian Desain</DialogTitle>
                <DialogDescription>
                  Pilih tipe kartu untuk varian desain baru Anda.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nama Template</Label>
                  <Input 
                    placeholder="Contoh: Modern Dark / School Spirit" 
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipe Kartu</Label>
                  <Select 
                    value={newTemplateType} 
                    onValueChange={(val: TemplateType) => setNewTemplateType(val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT_CARD">Kartu Pelajar</SelectItem>
                      <SelectItem value="EXAM_CARD">Kartu Ujian</SelectItem>
                      <SelectItem value="ID_CARD">ID Card Umum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Batal</Button>
                <Button onClick={handleAddTemplate}>Simpan Template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className={cn(
            "overflow-hidden border-2 transition-all flex flex-col group relative",
            template.is_active ? "border-primary shadow-lg bg-primary/[0.02]" : "border-transparent hover:border-slate-200"
          )}>
            <CardHeader className="pb-4 relative">
              <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-lg border shadow-sm text-white transition-transform group-hover:scale-110", template.preview_color || 'bg-slate-400')}>
                  <Layout className="h-5 w-5" />
                </div>
                <div className="flex gap-2">
                  {template.is_active ? (
                    <Badge className="gap-1 bg-primary px-3 py-1">
                      <CheckCircle2 className="h-3 w-3" /> Aktif
                    </Badge>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive opacity-40 hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTemplateToDelete(template.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <CardTitle className="text-xl font-bold">{template.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 font-medium italic">
                  {template.type.replace('_', ' ')} <ChevronRight className="h-3 w-3" />
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-2 space-y-6">
              <div className="aspect-[4/5] bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed relative overflow-hidden shadow-inner group-hover:bg-white transition-colors">
                <div className={cn(
                  "origin-center transform transition-transform duration-500 group-hover:scale-[0.65]",
                  template.type === 'ID_CARD' ? 'scale-[0.5]' : 'scale-[0.6]'
                )}>
                  {template.type === 'STUDENT_CARD' && previewStudent && settings ? (
                    <StudentCardVisual student={previewStudent} settings={settings} template={template} />
                  ) : template.type === 'EXAM_CARD' && previewStudent && settings ? (
                    <ExamCardVisual student={previewStudent} settings={settings} template={template} />
                  ) : template.type === 'ID_CARD' && previewStudent && settings ? (
                    <IdCardVisual student={previewStudent} settings={settings} side="front" template={template} />
                  ) : null}
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-4">
                <Button 
                  className="flex-1 gap-2 font-bold" 
                  variant={template.is_active ? 'secondary' : 'default'}
                  onClick={() => handleToggleActive(template.id)}
                  disabled={template.is_active}
                >
                  {template.is_active ? 'Sedang Aktif' : 'Aktifkan'}
                </Button>
                <Button variant="outline" size="icon" className="shadow-sm" onClick={() => openConfig(template)}>
                  <Palette className="h-4 w-4 text-primary" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini permanen. Template "{templates.find(t => t.id === templateToDelete)?.name}" akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Hapus Selamanya
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold">Kustomisasi Desain</DialogTitle>
                <DialogDescription>
                  Data siswa & sekolah dari database Anda ditampilkan di sini secara real-time.
                </DialogDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" onClick={handleResetConfig}>
                <RotateCcw className="h-3 w-3" /> Reset ke Default
              </Button>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
            <div className="space-y-6">
              <Tabs defaultValue="front" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="front">Sisi Depan</TabsTrigger>
                  <TabsTrigger value="back">Sisi Belakang</TabsTrigger>
                </TabsList>
                
                {['front', 'back'].map((side) => (
                  <TabsContent key={side} value={side} className="space-y-6 py-4 border rounded-xl p-4 mt-4 bg-slate-50/50">
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground">Warna & Tipografi</Label>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-white p-3 rounded-lg border shadow-sm space-y-2">
                          <Label className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                            <Type className="h-3 w-3" /> Jenis Font
                          </Label>
                          <Select 
                            value={localConfig[side].fontFamily} 
                            onValueChange={(val) => setLocalConfig({...localConfig, [side]: {...localConfig[side], fontFamily: val}})}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FONT_OPTIONS.map(font => (
                                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                  {font.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <ColorInput label="Header" value={localConfig[side].headerBg} onChange={(val) => setLocalConfig({...localConfig, [side]: {...localConfig[side], headerBg: val}})} />
                        <ColorInput label="Body" value={localConfig[side].bodyBg} onChange={(val) => setLocalConfig({...localConfig, [side]: {...localConfig[side], bodyBg: val}})} />
                        <ColorInput label="Footer" value={localConfig[side].footerBg} onChange={(val) => setLocalConfig({...localConfig, [side]: {...localConfig[side], footerBg: val}})} />
                        <ColorInput label="Teks" value={localConfig[side].textColor} onChange={(val) => setLocalConfig({...localConfig, [side]: {...localConfig[side], textColor: val}})} />
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground">Background Image</Label>
                      <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-3 bg-white">
                        {localConfig[side].bgImage ? (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                            <img src={localConfig[side].bgImage} className="w-full h-full object-cover" alt="BG" />
                            <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={() => setLocalConfig({...localConfig, [side]: {...localConfig[side], bgImage: ''}})}>×</Button>
                          </div>
                        ) : (
                          <div className="text-center py-4 opacity-50">
                            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-[9px] font-bold">Upload latar khusus</p>
                          </div>
                        )}
                        <Label className="w-full">
                          <div className="w-full h-10 bg-primary text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer">
                            <Upload className="h-3 w-3" /> Pilih Gambar
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(side as 'front' | 'back', e)} />
                        </Label>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-100 rounded-2xl border-2 border-slate-200 p-8 min-h-[400px]">
              <div className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Live Pratinjau (Data Riil)</div>
              <div className={cn(
                "transform transition-transform scale-90",
                editingTemplate?.type === 'ID_CARD' ? 'scale-[0.8]' : 'scale-[1]'
              )}>
                 {editingTemplate?.type === 'STUDENT_CARD' && previewStudent && settings ? (
                   <div className="flex flex-col gap-8">
                     <StudentCardVisual student={previewStudent} settings={settings} side="front" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                     <StudentCardVisual student={previewStudent} settings={settings} side="back" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                   </div>
                 ) : editingTemplate?.type === 'EXAM_CARD' && previewStudent && settings ? (
                   <div className="flex flex-col gap-8">
                     <ExamCardVisual student={previewStudent} settings={settings} side="front" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                     <ExamCardVisual student={previewStudent} settings={settings} side="back" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                   </div>
                 ) : editingTemplate?.type === 'ID_CARD' && previewStudent && settings ? (
                   <div className="flex flex-col gap-8">
                     <IdCardVisual student={previewStudent} settings={settings} side="front" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                     <IdCardVisual student={previewStudent} settings={settings} side="back" template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />
                   </div>
                 ) : null}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-6">
            <Button variant="ghost" onClick={() => setIsConfigOpen(false)}>Batal</Button>
            <Button className="gap-2 px-8 font-bold" onClick={handleSaveConfig}>
              <Save className="h-4 w-4" /> Simpan Konfigurasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-lg border shadow-sm">
      <Label className="text-[11px] font-bold text-slate-700">{label}</Label>
      <input 
        type="color" 
        className="w-10 h-10 p-0 border-none rounded-lg cursor-pointer bg-transparent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
