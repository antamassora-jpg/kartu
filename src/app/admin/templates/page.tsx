
"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
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
  Check,
  X,
  RotateCcw,
  Type,
  MousePointer2,
  Save,
  Move,
  Image as ImageIcon,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Upload,
  Edit2,
  Signature
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { StudentCardVisual } from '@/components/student-card-visual';
import { ExamCardVisual } from '@/components/exam-card-visual';
import { IdCardVisual } from '@/components/id-card-visual';
import { cn } from '@/lib/utils';
import { DEFAULT_SETTINGS } from '@/app/lib/db';

export default function TemplatesPage() {
  const db = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);
  
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<TemplateType>('STUDENT_CARD');

  // State for inline name editing
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const templatesQuery = useMemoFirebase(() => db ? collection(db, 'templates') : null, [db]);
  const { data: templatesData, isLoading } = useCollection<CardTemplate>(templatesQuery);
  const templates = templatesData || [];

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'school_settings', 'default') : null, [db]);
  const { data: dbSettings } = useDoc<SchoolSettings>(settingsRef);
  
  const activeSettings = useMemo(() => dbSettings || DEFAULT_SETTINGS, [dbSettings]);

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
    
    const isPortrait = newTemplateType === 'ID_CARD';
    const elements = isPortrait ? {
      photo: { x: 68, y: 100, w: 140, h: 180 },
      qr: { x: 110, y: 320, w: 56, h: 56 },
      info: { x: 20, y: 285, align: 'center', fontSize: 12, width: 236 },
      signature: { x: 150, y: 360, scale: 0.8 },
      principalInfo: { x: 150, y: 395, fontSize: 7 },
      stamp: { x: 130, y: 380, scale: 0.8 },
      terms: { x: 18, y: 120, width: 240 }
    } : {
      photo: { x: 15, y: 70, w: 60, h: 80 },
      qr: { x: 15, y: 155, w: 48, h: 48 },
      info: { x: 90, y: 70, align: 'left', fontSize: 10, width: 180 },
      signature: { x: 240, y: 150, scale: 0.75 },
      principalInfo: { x: 240, y: 180, fontSize: 6 },
      stamp: { x: 220, y: 160, scale: 0.75 },
      terms: { x: 30, y: 60, width: 280 }
    };

    const newTemplate = {
      name: newTemplateName,
      type: newTemplateType,
      config_json: JSON.stringify({
        front: { 
          headerBg: isPortrait ? '#1B3C33' : '#2E50B8', bodyBg: '#ffffff', footerBg: isPortrait ? '#10B981' : '#4FBFDD', textColor: '#334155', fontFamily: 'Inter',
          elements: { ...elements },
          watermark: { enabled: false, text: 'SMKN 2 TANA TORAJA', opacity: 0.1, size: 10, angle: -30, imageEnabled: false, imageUrl: '', imageOpacity: 0.1, imageSize: 100 }
        },
        back: { 
          headerBg: isPortrait ? '#1B3C33' : '#2E50B8', bodyBg: '#ffffff', footerBg: '#f8fafc', textColor: '#334155', fontFamily: 'Inter',
          elements: { ...elements },
          watermark: { enabled: false, text: 'SMKN 2 TANA TORAJA', opacity: 0.1, size: 10, angle: -30, imageEnabled: false, imageUrl: '', imageOpacity: 0.1, imageSize: 100 }
        }
      }),
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

  const handleStartRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setTempName(currentName);
  };

  const handleSaveRename = async (id: string) => {
    if (!db || !tempName.trim()) return;
    setIsUpdatingName(true);
    try {
      await updateDoc(doc(db, 'templates', id), { name: tempName });
      setRenamingId(null);
      toast({ title: "Nama Diperbarui", description: "Nama template berhasil diubah." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal merubah nama." });
    } finally {
      setIsUpdatingName(false);
    }
  };

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
       <Loader2 className="h-10 w-10 animate-spin text-primary" />
       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Menyiapkan Visual Editor...</p>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="space-y-10 pb-20">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.length > 0 ? templates.map((template) => (
            <div 
              key={template.id} 
              className={`group relative flex flex-col bg-white rounded-[2.5rem] border-[3px] transition-all duration-500 p-8 shadow-sm ${template.is_active ? "border-[#2E50B8] shadow-2xl shadow-blue-500/10" : "border-slate-100 hover:border-slate-200 hover:shadow-xl"}`}
            >
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

              <div className="mb-8">
                {renamingId === template.id ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <Input 
                      value={tempName} 
                      onChange={(e) => setTempName(e.target.value)} 
                      className="h-9 font-bold uppercase rounded-lg border-primary focus-visible:ring-primary"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(template.id)}
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-emerald-500 hover:bg-emerald-50"
                      onClick={() => handleSaveRename(template.id)}
                      disabled={isUpdatingName}
                    >
                      {isUpdatingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-red-400 hover:bg-red-50"
                      onClick={() => setRenamingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group/title">
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 leading-tight">
                      {template.name}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover/title:opacity-100 transition-opacity text-slate-300 hover:text-primary"
                      onClick={() => handleStartRename(template.id, template.name)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">{template.type.replace('_', ' ')}</p>
              </div>

              <div className="flex-1 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100 p-6 flex flex-col items-center gap-8 mb-8 overflow-hidden">
                <div className={cn("origin-top shadow-2xl rounded-xl overflow-hidden", template.type === 'ID_CARD' ? "scale-[0.35] -mb-[220px]" : "scale-[0.45] -mb-[110px]")}>
                  {renderPreview(template.type, dummyStudent, activeSettings, 'front', template)}
                </div>
                <div className={cn("origin-top shadow-2xl rounded-xl overflow-hidden pt-4", template.type === 'ID_CARD' ? "scale-[0.35] -mb-[220px]" : "scale-[0.45] -mb-[110px]")}>
                  {renderPreview(template.type, dummyStudent, activeSettings, 'back', template)}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${template.is_active ? 'bg-[#2E50B8]/10 text-[#2E50B8] border-none hover:bg-[#2E50B8]/20' : 'bg-slate-100 text-slate-400 hover:bg-[#2E50B8] hover:text-white'}`}
                  onClick={() => handleToggleActive(template.id, template.type)} 
                  disabled={template.is_active}
                >
                  {template.is_active ? 'AKTIF' : 'AKTIFKAN'}
                </Button>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2 border-slate-100 text-slate-400 hover:text-[#2E50B8] hover:border-[#2E50B8] transition-colors" onClick={() => { setEditingTemplate(template); setIsEditorOpen(true); }}>
                      <Palette className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[10px] font-bold uppercase tracking-widest">Visual Editor & Kustomisasi Warna</p></TooltipContent>
                </Tooltip>

                {!template.is_active && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)} className="h-12 w-12 rounded-xl text-red-200 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-[10px] font-bold uppercase tracking-widest">Hapus Varian</p></TooltipContent>
                  </Tooltip>
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

        {/* MODAL BUAT VARIAN */}
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
                <Input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="Contoh: Modern Blue Style" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Jenis Kartu</Label>
                <Select value={newTemplateType} onValueChange={(v: any) => setNewTemplateType(v)}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
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

        {/* VISUAL EDITOR MODAL */}
        {isEditorOpen && editingTemplate && (
          <VisualEditorModal 
            isOpen={isEditorOpen} 
            onOpenChange={setIsEditorOpen}
            template={editingTemplate} 
            student={dummyStudent}
            settings={activeSettings}
            db={db!}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

function VisualEditorModal({ isOpen, onOpenChange, template, student, settings, db }: { 
  isOpen: boolean, 
  onOpenChange: (open: boolean) => void, 
  template: CardTemplate,
  student: Student,
  settings: SchoolSettings | null,
  db: any
}) {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [config, setConfig] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const wmLogoInputRef = useRef<HTMLInputElement>(null);

  const isPortrait = template.type === 'ID_CARD';
  const dimensions = isPortrait ? { w: 276, h: 420 } : { w: 340, h: 215 };

  // Hitung visibilitas elemen untuk editor hotspot
  const tKey = template.type === 'STUDENT_CARD' ? 'student' : (template.type === 'EXAM_CARD' ? 'exam' : 'id');
  const showPhoto = activeSide === 'front' ? (settings?.[`${tKey}_show_photo_front` as any] ?? true) : (settings?.[`${tKey}_show_photo_back` as any] ?? false);
  const showQr = activeSide === 'front' ? (settings?.[`${tKey}_show_qr_front` as any] ?? false) : (settings?.[`${tKey}_show_qr_back` as any] ?? true);
  const showInfo = activeSide === 'front' ? (settings?.[`${tKey}_show_info_front` as any] ?? true) : (settings?.[`${tKey}_show_info_back` as any] ?? false);
  const showValid = activeSide === 'front' ? (settings?.[`${tKey}_show_valid_front` as any] ?? true) : (settings?.[`${tKey}_show_valid_back` as any] ?? false);
  const showSig = activeSide === 'front' ? (settings?.[`${tKey}_show_sig_front` as any] ?? false) : (settings?.[`${tKey}_show_sig_back` as any] ?? true);
  const showStamp = activeSide === 'front' ? (settings?.[`${tKey}_show_stamp_front` as any] ?? false) : (settings?.[`${tKey}_show_stamp_back` as any] ?? true);

  useEffect(() => {
    try {
      const parsed = JSON.parse(template.config_json || '{}');
      
      const defaultElements = isPortrait ? {
        photo: { x: 68, y: 100, w: 140, h: 180 },
        qr: { x: 110, y: 320, w: 56, h: 56 },
        info: { x: 20, y: 285, align: 'center', fontSize: 12, width: 236 },
        signature: { x: 150, y: 360, scale: 0.8 },
        principalInfo: { x: 150, y: 395, fontSize: 7 },
        stamp: { x: 130, y: 380, scale: 0.8 },
        terms: { x: 18, y: 120, width: 240 }
      } : { 
        photo: { x: 15, y: 70, w: 60, h: 80 }, 
        qr: { x: 15, y: 155, w: 48, h: 48 }, 
        info: { x: 90, y: 70, align: 'left', fontSize: 10, width: 180 }, 
        signature: { x: 240, y: 150, scale: 0.75 },
        principalInfo: { x: 240, y: 180, fontSize: 6 },
        stamp: { x: 220, y: 160, scale: 0.75 },
        terms: { x: 30, y: 60, width: 280 }
      };

      const base = {
        headerBg: isPortrait ? '#1B3C33' : '#2E50B8', bodyBg: '#ffffff', footerBg: isPortrait ? '#10B981' : '#4FBFDD', textColor: '#334155', bgImage: '', fontFamily: 'Inter',
        elements: defaultElements,
        watermark: { 
          enabled: false, 
          text: 'SMKN 2 TANA TORAJA', 
          opacity: 0.1, 
          size: 10, 
          angle: -30,
          imageEnabled: false,
          imageUrl: '',
          imageOpacity: 0.1,
          imageSize: 100
        }
      };
      setConfig({
        front: { ...base, ...parsed.front, elements: { ...base.elements, ...parsed.front?.elements } },
        back: { ...base, ...parsed.back, elements: { ...base.elements, ...parsed.back?.elements } }
      });
    } catch (e) {
    }
  }, [template, isPortrait]);

  if (!config) return null;

  const updateConfig = (side: 'front' | 'back', field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [side]: { ...prev[side], [field]: value }
    }));
  };

  const updateElement = (side: 'front' | 'back', el: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [side]: { 
        ...prev[side], 
        elements: { 
          ...prev[side].elements, 
          [el]: { ...prev[side].elements[el], [field]: value } 
        } 
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'templates', template.id), {
        config_json: JSON.stringify(config)
      });
      toast({ title: "Desain Tersimpan", description: "Tata letak kartu telah diperbarui." });
      onOpenChange(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Simpan" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'bgImage' | 'wmLogo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (field === 'bgImage') {
        updateConfig(activeSide, 'bgImage', dataUrl);
      } else {
        updateConfig(activeSide, 'watermark', { ...current.watermark, imageUrl: dataUrl, imageEnabled: true });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePointerDown = (e: React.PointerEvent, el: string) => {
    e.stopPropagation();
    setDraggingElement(el);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingElement || !editorRef.current) return;
    const rect = editorRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    
    const boundedX = Math.max(0, Math.min(x, dimensions.w));
    const boundedY = Math.max(0, Math.min(y, dimensions.h));

    updateElement(activeSide, draggingElement, 'x', boundedX);
    updateElement(activeSide, draggingElement, 'y', boundedY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDraggingElement(null);
  };

  const current = config[activeSide];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>Visual Editor & Layout Hub</DialogTitle>
          <DialogDescription>Editor profesional untuk mengatur tata letak dan estetika kartu.</DialogDescription>
        </DialogHeader>
        
        <div className="bg-[#1e293b] p-8 text-white flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Visual Editor & Layout Hub</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Sesuai skema warna, font, dan posisi elemen secara presisi</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white/5 border-white/10 text-white gap-2 h-10 rounded-full text-[10px] font-bold uppercase tracking-widest"><RotateCcw className="h-3 w-3" /> Reset Layout</Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white h-10 w-10 p-0 rounded-full hover:bg-white/10"><X className="h-5 w-5" /></Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-[75vh]">
          {/* Sidebar Editor */}
          <div className="w-full lg:w-[400px] bg-slate-50/50 border-r p-8 overflow-y-auto space-y-10 custom-scrollbar">
            {/* Side Tabs */}
            <div className="grid grid-cols-2 p-1 bg-white rounded-xl shadow-inner">
              <button onClick={() => setActiveSide('front')} className={cn("h-10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", activeSide === 'front' ? "bg-[#1e293b] text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}>Tampak Depan</button>
              <button onClick={() => setActiveSide('back')} className={cn("h-10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", activeSide === 'back' ? "bg-[#1e293b] text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}>Tampak Belakang</button>
            </div>

            {/* Estetika */}
            <div className="space-y-6">
              <div className="flex items-center gap-2"><Palette className="h-4 w-4 text-[#2E50B8]" /><h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Estetika & Visual</h4></div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipografi Utama</Label>
                <Select value={current.fontFamily} onValueChange={(v) => updateConfig(activeSide, 'fontFamily', v)}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-sm font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter (Default)</SelectItem>
                    <SelectItem value="Oswald">Oswald (Bold Headline)</SelectItem>
                    <SelectItem value="Roboto Mono">Roboto Mono (Tech)</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Header" value={current.headerBg} onChange={(v) => updateConfig(activeSide, 'headerBg', v)} />
                <ColorField label="Body" value={current.bodyBg} onChange={(v) => updateConfig(activeSide, 'bodyBg', v)} />
                <ColorField label="Footer" value={current.footerBg} onChange={(v) => updateConfig(activeSide, 'footerBg', v)} />
                <ColorField label="Teks" value={current.textColor} onChange={(v) => updateConfig(activeSide, 'textColor', v)} />
              </div>
            </div>

            {/* Watermark Section */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2E50B8]" /><h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Watermark Teks</h4></div>
                <Switch checked={current.watermark.enabled} onCheckedChange={(v) => updateConfig(activeSide, 'watermark', { ...current.watermark, enabled: v })} />
              </div>
              {current.watermark.enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <Input value={current.watermark.text} onChange={(e) => updateConfig(activeSide, 'watermark', { ...current.watermark, text: e.target.value })} className="h-10 rounded-lg text-xs" placeholder="Teks Watermark..." />
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400"><span>Opacity</span><span>{Math.round(current.watermark.opacity * 100)}%</span></div>
                    <Slider value={[current.watermark.opacity * 100]} onValueChange={([v]) => updateConfig(activeSide, 'watermark', { ...current.watermark, opacity: v/100 })} max={50} step={1} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-[#2E50B8]" /><h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Watermark Gambar (Logo)</h4></div>
                <Switch checked={current.watermark.imageEnabled} onCheckedChange={(v) => updateConfig(activeSide, 'watermark', { ...current.watermark, imageEnabled: v })} />
              </div>
              {current.watermark.imageEnabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <Button variant="outline" className="w-full h-10 text-[9px] font-black uppercase" onClick={() => wmLogoInputRef.current?.click()}>GANTI LOGO WATERMARK</Button>
                  <input type="file" ref={wmLogoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'wmLogo')} />
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400"><span>Ukuran Gambar</span><span>{current.watermark.imageSize}px</span></div>
                    <Slider value={[current.watermark.imageSize]} onValueChange={([v]) => updateConfig(activeSide, 'watermark', { ...current.watermark, imageSize: v })} max={300} min={50} step={5} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400"><span>Opacity</span><span>{Math.round(current.watermark.imageOpacity * 100)}%</span></div>
                    <Slider value={[current.watermark.imageOpacity * 100]} onValueChange={([v]) => updateConfig(activeSide, 'watermark', { ...current.watermark, imageOpacity: v/100 })} max={50} step={1} />
                  </div>
                </div>
              )}
            </div>

            {/* Dimensi & Ukuran Elemen */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2"><Move className="h-4 w-4 text-[#2E50B8]" /><h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Dimensi & Ukuran Elemen</h4></div>
              
              <DimensionSlider label="Lebar Foto" value={current.elements.photo.w} max={150} min={30} onChange={(v) => { updateElement(activeSide, 'photo', 'w', v); updateElement(activeSide, 'photo', 'h', Math.round(v * 1.33)); }} unit="px" />
              <DimensionSlider label="Ukuran QR Code" value={current.elements.qr.w} max={100} min={20} onChange={(v) => { updateElement(activeSide, 'qr', 'w', v); updateElement(activeSide, 'qr', 'h', v); }} unit="px" />
              <DimensionSlider label="Lebar Blok Identitas" value={current.elements.info.width} max={300} min={100} onChange={(v) => updateElement(activeSide, 'info', 'width', v)} unit="px" />
              <DimensionSlider label="Ukuran Font Teks" value={current.elements.info.fontSize} max={24} min={6} onChange={(v) => updateElement(activeSide, 'info', 'fontSize', v)} unit="px" />
              <DimensionSlider label="Skala Tanda Tangan" value={Math.round((current.elements.signature?.scale || 0.75) * 100)} max={150} min={30} onChange={(v) => updateElement(activeSide, 'signature', 'scale', v/100)} unit="%" />
              <DimensionSlider label="Skala Stempel" value={Math.round((current.elements.stamp?.scale || 0.75) * 100)} max={150} min={30} onChange={(v) => updateElement(activeSide, 'stamp', 'scale', v/100)} unit="%" />
              
              {activeSide === 'back' && (
                <DimensionSlider label="Lebar Teks Ketentuan" value={current.elements.terms?.width || 240} max={320} min={100} onChange={(v) => updateElement(activeSide, 'terms', 'width', v)} unit="px" />
              )}

              <div className="space-y-2">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Perataan Identitas</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className={cn("flex-1 h-10", current.elements.info.align === 'left' && "bg-primary text-white border-none")} onClick={() => updateElement(activeSide, 'info', 'align', 'left')}><AlignLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" className={cn("flex-1 h-10", current.elements.info.align === 'center' && "bg-primary text-white border-none")} onClick={() => updateElement(activeSide, 'info', 'align', 'center')}><AlignCenter className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" className={cn("flex-1 h-10", current.elements.info.align === 'right' && "bg-primary text-white border-none")} onClick={() => updateElement(activeSide, 'info', 'align', 'right')}><AlignRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            {/* Background Image */}
            <div className="space-y-6 pt-4 border-t border-slate-100 pb-10">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Background Sisi Ini</h4>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 text-slate-400 gap-2 font-black uppercase tracking-widest text-[10px]" onClick={() => bgInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> UNGGAH LATAR
              </Button>
              <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bgImage')} />
              {current.bgImage && (
                <Button variant="ghost" className="w-full text-[9px] text-red-500 font-bold uppercase" onClick={() => updateConfig(activeSide, 'bgImage', '')}>HAPUS BACKGROUND</Button>
              )}
            </div>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="flex-1 bg-slate-100/50 flex flex-col items-center justify-center p-12 relative overflow-hidden">
            <div className="absolute top-8 bg-white/80 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-slate-200 flex items-center gap-3 z-20">
              <MousePointer2 className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Mode Editor: Drag untuk pindahkan elemen</span>
            </div>

            <div className="relative group cursor-crosshair">
              <div 
                ref={editorRef}
                className="relative shadow-[0_30px_100px_-12px_rgba(0,0,0,0.3)] rounded-xl overflow-hidden bg-white"
                style={{ width: `${dimensions.w}px`, height: `${dimensions.h}px` }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {renderPreview(template.type, student, settings, activeSide, { ...template, config_json: JSON.stringify(config) })}
                
                {/* Draggable Hotspots */}
                {showPhoto && <EditorHotspot x={current.elements.photo.x} y={current.elements.photo.y} w={current.elements.photo.w} h={current.elements.photo.h} onDown={(e) => handlePointerDown(e, 'photo')} isActive={draggingElement === 'photo'} label="FOTO" />}
                {showQr && <EditorHotspot x={current.elements.qr.x} y={current.elements.qr.y} w={current.elements.qr.w} h={current.elements.qr.h} onDown={(e) => handlePointerDown(e, 'qr')} isActive={draggingElement === 'qr'} label="QR" />}
                {(showInfo || showValid) && <EditorHotspot x={current.elements.info.x} y={current.elements.info.y} w={current.elements.info.width} h={60} onDown={(e) => handlePointerDown(e, 'info')} isActive={draggingElement === 'info'} label="INFO SISWA" />}
                
                {/* Separated Legal Elements */}
                {showSig && <EditorHotspot x={current.elements.signature?.x || 240} y={current.elements.signature?.y || 150} w={60} h={30} onDown={(e) => handlePointerDown(e, 'signature')} isActive={draggingElement === 'signature'} label="GAMBAR TTD" />}
                {showSig && <EditorHotspot x={current.elements.principalInfo?.x || 240} y={current.elements.principalInfo?.y || 180} w={100} h={25} onDown={(e) => handlePointerDown(e, 'principalInfo')} isActive={draggingElement === 'principalInfo'} label="NAMA & NIP" />}
                
                {showStamp && <EditorHotspot x={current.elements.stamp?.x || 220} y={current.elements.stamp?.y || 160} w={40} h={40} onDown={(e) => handlePointerDown(e, 'stamp')} isActive={draggingElement === 'stamp'} label="STEMPEL" />}
                
                {activeSide === 'back' && current.elements.terms && (
                  <EditorHotspot 
                    x={current.elements.terms.x} 
                    y={current.elements.terms.y} 
                    w={current.elements.terms.width} 
                    h={100} 
                    onDown={(e) => handlePointerDown(e, 'terms')} 
                    isActive={draggingElement === 'terms'} 
                    label="KETENTUAN" 
                  />
                )}
              </div>
            </div>

            <div className="mt-12 bg-white rounded-2xl p-6 border border-slate-200 max-w-sm flex items-start gap-4">
               <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0"><Type className="h-5 w-5 text-primary" /></div>
               <div className="space-y-1">
                 <h5 className="text-xs font-black uppercase tracking-tight text-slate-800">Kustomisasi Tata Letak</h5>
                 <p className="text-[10px] text-slate-500 leading-relaxed">Geser elemen langsung pada kartu untuk menentukan posisi terbaik. Gunakan slider di panel kiri untuk mengubah ukuran foto, barcode, teks, dan skala legalitas secara presisi.</p>
               </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t flex items-center justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400">Batal</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[#2E50B8] hover:bg-[#1e3a8a] text-white px-10 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 gap-3">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} SIMPAN DESAIN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColorField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2 bg-white p-3 rounded-xl shadow-sm border border-slate-100 group transition-all hover:border-primary/20">
      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 rounded-full border-2 border-slate-50 shadow-sm overflow-hidden" style={{ backgroundColor: value }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">{value}</span>
      </div>
    </div>
  );
}

function DimensionSlider({ label, value, max, min, onChange, unit }: { label: string, value: number, max: number, min: number, onChange: (v: number) => void, unit: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400">
        <span>{label}</span>
        <span>{value}{unit}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} max={max} min={min} step={1} />
    </div>
  );
}

function EditorHotspot({ x, y, w, h, onDown, isActive, label }: { x: number, y: number, w: number, h: number, onDown: (e: any) => void, isActive: boolean, label: string }) {
  return (
    <div 
      onPointerDown={onDown}
      className={cn(
        "absolute cursor-move border-2 transition-all group/hotspot flex items-center justify-center overflow-hidden",
        isActive ? "border-primary bg-primary/10 scale-105 z-50 shadow-2xl" : "border-transparent hover:border-primary/40 hover:bg-primary/5 z-40"
      )}
      style={{ left: x, top: y, width: w, height: h }}
    >
      <div className="bg-primary text-white text-[7px] font-black px-1.5 py-0.5 rounded-br-md absolute top-0 left-0 opacity-0 group-hover/hotspot:opacity-100 transition-opacity">
        {label}
      </div>
      <Move className={cn("h-4 w-4 text-primary opacity-0 group-hover/hotspot:opacity-100 transition-opacity", isActive && "opacity-100")} />
    </div>
  );
}

function renderPreview(type: TemplateType, student: Student, settings: SchoolSettings | null, side: 'front' | 'back', template: CardTemplate) {
  const activeSettings = settings || DEFAULT_SETTINGS;
  
  switch(type) {
    case 'STUDENT_CARD':
      return <StudentCardVisual student={student} settings={activeSettings} side={side} template={template} />;
    case 'EXAM_CARD':
      return <ExamCardVisual student={student} settings={activeSettings} side={side} template={template} />;
    case 'ID_CARD':
      return <IdCardVisual student={student} settings={activeSettings} side={side} template={template} />;
    default:
      return null;
  }
}
