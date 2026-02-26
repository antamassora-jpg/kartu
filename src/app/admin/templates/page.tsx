
"use client";

import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/app/lib/db';
import { CardTemplate, SchoolSettings, Student } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, 
  Palette, 
  CheckCircle2, 
  Save,
  RefreshCw,
  Check,
  Upload,
  Image as ImageIcon,
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_CONFIG = {
  front: {
    headerBg: '#1B3C33',
    bodyBg: '#ffffff',
    footerBg: '#10B981',
    textColor: '#ffffff',
    bgImage: '',
  },
  back: {
    headerBg: '#1B3C33',
    bodyBg: '#ffffff',
    footerBg: '#f8fafc',
    textColor: '#ffffff',
    bgImage: '',
  }
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);
  const [localConfig, setLocalConfig] = useState<any>(DEFAULT_CONFIG);

  useEffect(() => {
    const db = getDB();
    setTemplates(db.templates);
    setSettings(db.school_settings);
    if (db.students.length > 0) setPreviewStudent(db.students[0]);
  }, []);

  useEffect(() => {
    if (editingTemplate) {
      try {
        const parsed = JSON.parse(editingTemplate.config_json);
        setLocalConfig(parsed.front ? parsed : DEFAULT_CONFIG);
      } catch (e) {
        setLocalConfig(DEFAULT_CONFIG);
      }
    }
  }, [editingTemplate]);

  const handleToggleActive = (id: string) => {
    const db = getDB();
    const type = db.templates.find(t => t.id === id)?.type;
    const updated = db.templates.map(t => {
      if (t.type === type) return { ...t, is_active: t.id === id };
      return t;
    });
    db.templates = updated;
    saveDB(db);
    setTemplates(updated);
    toast({ title: "Template Diperbarui", description: "Template aktif berhasil diubah." });
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

  const handleResetData = () => {
    localStorage.removeItem('educard_sync_db');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Template Desain</h1>
          <p className="text-muted-foreground">Kustomisasi penuh warna, background, dan tata letak kartu.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleResetData}>
            <RefreshCw className="h-4 w-4" /> Reset Database
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className={cn(
            "overflow-hidden border-2 transition-all flex flex-col",
            template.is_active ? "border-primary shadow-lg bg-primary/5" : "border-transparent"
          )}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-lg border shadow-sm text-white", template.preview_color || 'bg-slate-400')}>
                  <Layout className="h-5 w-5" />
                </div>
                {template.is_active && (
                  <Badge className="gap-1 bg-primary">
                    <CheckCircle2 className="h-3 w-3" /> Aktif
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <CardDescription>
                  Tipe: {template.type.replace('_', ' ')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-2 space-y-6">
              <div className="aspect-[4/5] bg-white rounded-xl flex items-center justify-center border-2 border-dashed relative group overflow-hidden shadow-inner">
                <div className={cn(
                  "origin-center transform transition-transform group-hover:scale-[0.55] duration-500",
                  template.type === 'ID_CARD' ? 'scale-[0.4]' : 'scale-[0.5]'
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
                  className="flex-1 gap-2" 
                  variant={template.is_active ? 'secondary' : 'default'}
                  onClick={() => handleToggleActive(template.id)}
                >
                  {template.is_active ? 'Sedang Digunakan' : 'Aktifkan'}
                </Button>
                <Button variant="outline" size="icon" onClick={() => openConfig(template)}>
                  <Palette className="h-4 w-4 text-primary" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editor Template Lanjut</DialogTitle>
            <DialogDescription>
              Modifikasi warna per bagian dan unggah background untuk <strong>{editingTemplate?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="front" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="front">Tampak Depan</TabsTrigger>
              <TabsTrigger value="back">Tampak Belakang</TabsTrigger>
            </TabsList>
            
            {['front', 'back'].map((side) => (
              <TabsContent key={side} value={side} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Warna Bagian</Label>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between gap-4">
                          <Label className="text-xs">Header (Atas)</Label>
                          <input 
                            type="color" 
                            className="w-10 h-10 p-0 border-none rounded cursor-pointer"
                            value={localConfig[side].headerBg}
                            onChange={(e) => setLocalConfig({...localConfig, [side]: {...localConfig[side], headerBg: e.target.value}})}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <Label className="text-xs">Body (Tengah)</Label>
                          <input 
                            type="color" 
                            className="w-10 h-10 p-0 border-none rounded cursor-pointer"
                            value={localConfig[side].bodyBg}
                            onChange={(e) => setLocalConfig({...localConfig, [side]: {...localConfig[side], bodyBg: e.target.value}})}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <Label className="text-xs">Footer (Bawah)</Label>
                          <input 
                            type="color" 
                            className="w-10 h-10 p-0 border-none rounded cursor-pointer"
                            value={localConfig[side].footerBg}
                            onChange={(e) => setLocalConfig({...localConfig, [side]: {...localConfig[side], footerBg: e.target.value}})}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <Label className="text-xs">Warna Teks Utama</Label>
                          <input 
                            type="color" 
                            className="w-10 h-10 p-0 border-none rounded cursor-pointer"
                            value={localConfig[side].textColor || '#ffffff'}
                            onChange={(e) => setLocalConfig({...localConfig, [side]: {...localConfig[side], textColor: e.target.value}})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Background Image</Label>
                    <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-3 bg-muted/5">
                      {localConfig[side].bgImage ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                          <img src={localConfig[side].bgImage} className="w-full h-full object-cover" />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => setLocalConfig({...localConfig, [side]: {...localConfig[side], bgImage: ''}})}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-[10px] text-muted-foreground">PNG/JPG (Transparan disarankan)</p>
                        </div>
                      )}
                      <Label className="w-full">
                        <div className="w-full h-9 bg-primary text-white text-xs font-bold rounded-md flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/90 transition-colors">
                          <Upload className="h-3 w-3" /> Pilih Gambar
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(side as 'front' | 'back', e)}
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setIsConfigOpen(false)}>Batal</Button>
            <Button className="gap-2" onClick={handleSaveConfig}>
              <Save className="h-4 w-4" /> Simpan Konfigurasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
