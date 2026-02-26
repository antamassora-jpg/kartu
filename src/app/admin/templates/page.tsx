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
  Trash2, 
  Plus, 
  Eye, 
  Settings2,
  Save,
  RefreshCw
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
import { Textarea } from '@/components/ui/textarea';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  
  // State for Configuration Dialog
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);

  useEffect(() => {
    const db = getDB();
    setTemplates(db.templates);
    setSettings(db.school_settings);
    if (db.students.length > 0) setPreviewStudent(db.students[0]);
  }, []);

  const handleToggleActive = (id: string) => {
    const db = getDB();
    const type = db.templates.find(t => t.id === id)?.type;
    
    const updated = db.templates.map(t => {
      if (t.type === type) {
        return { ...t, is_active: t.id === id };
      }
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

  const handleSaveConfig = () => {
    if (!editingTemplate) return;

    const db = getDB();
    const updated = db.templates.map(t => 
      t.id === editingTemplate.id ? editingTemplate : t
    );
    
    db.templates = updated;
    saveDB(db);
    setTemplates(updated);
    setIsConfigOpen(false);
    toast({ title: "Tersimpan", description: `Konfigurasi ${editingTemplate.name} telah diperbarui.` });
  };

  const handleResetData = () => {
    localStorage.removeItem('educard_sync_db');
    window.location.reload();
  };

  const handleAddNew = () => {
    toast({ title: "Segera Hadir", description: "Fitur pembuatan template kustom sedang dikembangkan." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Template Desain</h1>
          <p className="text-muted-foreground">Pilih, aktifkan, dan kustomisasi gaya visual kartu sekolah Anda.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleResetData}>
            <RefreshCw className="h-4 w-4" /> Reset Database
          </Button>
          <Button className="gap-2" onClick={handleAddNew}>
            <Plus className="h-4 w-4" /> Template Baru
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className={`overflow-hidden border-2 transition-all flex flex-col ${template.is_active ? 'border-primary shadow-lg bg-primary/5' : 'border-transparent'}`}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-lg border shadow-sm ${template.preview_color || 'bg-slate-400'} text-white`}>
                  <Layout className="h-5 w-5" />
                </div>
                <div className="flex gap-2">
                  {template.is_active && (
                    <Badge className="gap-1 bg-primary">
                      <CheckCircle2 className="h-3 w-3" /> Aktif
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openConfig(template)}>
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <CardDescription>
                  Tipe: {template.type === 'STUDENT_CARD' ? 'Kartu Pelajar' : template.type === 'EXAM_CARD' ? 'Kartu Ujian' : 'ID Card Umum'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-2 space-y-6">
              <div className="aspect-[4/5] bg-white rounded-xl flex items-center justify-center border-2 border-dashed relative group overflow-hidden shadow-inner">
                <div className={`${template.type === 'ID_CARD' ? 'scale-[0.4]' : 'scale-[0.5]'} origin-center transform transition-transform group-hover:scale-[0.6] duration-500`}>
                  {template.type === 'STUDENT_CARD' && previewStudent && settings ? (
                    <StudentCardVisual student={previewStudent} settings={settings} />
                  ) : template.type === 'EXAM_CARD' && previewStudent && settings ? (
                    <ExamCardVisual student={previewStudent} settings={settings} />
                  ) : template.type === 'ID_CARD' && previewStudent && settings ? (
                    <IdCardVisual student={previewStudent} settings={settings} side="front" template={template} />
                  ) : (
                    <div className="w-[340px] h-[215px] bg-white border rounded-xl flex flex-col items-center justify-center p-4 text-center">
                      <div className={`w-full h-10 ${template.preview_color} rounded-t-lg mb-4 opacity-50`}></div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Desain {template.name}</p>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" className="gap-2">
                    <Eye className="h-4 w-4" /> Zoom Preview
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-4">
                <Button 
                  className="flex-1 gap-2" 
                  variant={template.is_active ? 'secondary' : 'default'}
                  disabled={template.is_active}
                  onClick={() => handleToggleActive(template.id)}
                >
                  {template.is_active ? 'Sedang Digunakan' : 'Aktifkan Template'}
                </Button>
                <Button variant="outline" size="icon" onClick={() => openConfig(template)}>
                  <Palette className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="outline" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-2 border-dashed flex flex-col items-center justify-center py-12 gap-4 cursor-pointer hover:bg-muted/50 transition-colors group" onClick={handleAddNew}>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Plus className="h-8 w-8" />
          </div>
          <div className="text-center px-4">
            <h4 className="font-bold">Buat Desain Baru</h4>
            <p className="text-xs text-muted-foreground">Rancang template kustom untuk sekolah Anda.</p>
          </div>
        </Card>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pengaturan Template</DialogTitle>
            <DialogDescription>
              Kustomisasi properti visual untuk template <strong>{editingTemplate?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="t-name">Nama Template</Label>
                <Input 
                  id="t-name" 
                  value={editingTemplate.name} 
                  onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-color">Preview Color (Tailwind Class)</Label>
                <Input 
                  id="t-color" 
                  value={editingTemplate.preview_color} 
                  onChange={e => setEditingTemplate({...editingTemplate, preview_color: e.target.value})}
                  placeholder="bg-blue-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-config">Konfigurasi JSON (Warna Primer, dsb)</Label>
                <Textarea 
                  id="t-config" 
                  className="font-mono text-xs min-h-[100px]"
                  value={editingTemplate.config_json} 
                  onChange={e => setEditingTemplate({...editingTemplate, config_json: e.target.value})}
                />
                <p className="text-[10px] text-muted-foreground italic">Gunakan format JSON, contoh: {"{\"primary\": \"#1B3C33\"}"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
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
