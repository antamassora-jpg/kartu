
"use client";

import { useState, useEffect, useRef } from 'react';
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
  ImageIcon,
  Upload,
  X,
  ArrowRightLeft,
  Move,
  Maximize2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Type as FontIcon,
  PenTool,
  ShieldCheck,
  Link as LinkIcon
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
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, getDocs } from 'firebase/firestore';

const FONT_OPTIONS = [
  { name: 'Inter (Default)', value: 'Inter, sans-serif' },
  { name: 'Oswald (Bold Display)', value: 'Oswald, sans-serif' },
  { name: 'Montserrat (Modern)', value: 'Montserrat, sans-serif' },
  { name: 'Playfair Display (Elegant)', value: 'Playfair Display, serif' },
  { name: 'Roboto Mono (Technical)', value: 'Roboto Mono, monospace' },
];

const DEFAULT_ELEMENTS_LANSKAP = {
  photo: { x: 15, y: 70, w: 60, h: 80 },
  qr: { x: 15, y: 155, w: 48, h: 48 },
  info: { x: 90, y: 70, align: 'left', fontSize: 10, width: 180 },
  sigBlock: { x: 240, y: 160, scale: 0.75 }
};

const DEFAULT_ELEMENTS_POTRET = {
  photo: { x: 68, y: 100, w: 140, h: 180 },
  qr: { x: 110, y: 290, w: 56, h: 56 },
  info: { x: 20, y: 355, align: 'center', fontSize: 12, width: 236 },
  sigBlock: { x: 150, y: 380, scale: 0.8 }
};

const DEFAULT_WATERMARK = {
  enabled: false,
  text: 'SMKN 2 TANA TORAJA',
  opacity: 0.1,
  size: 10,
  angle: -30,
  imageEnabled: false,
  imageUrl: '',
  imageOpacity: 0.1,
  imageSize: 150
};

export default function TemplatesPage() {
  const db = useFirestore();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<TemplateType>('STUDENT_CARD');
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wmImageInputRef = useRef<HTMLInputElement>(null);

  const templatesQuery = useMemoFirebase(() => db ? collection(db, 'templates') : null, [db]);
  const { data: templates = [], isLoading: loadingTemplates } = useCollection<CardTemplate>(templatesQuery);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'school_settings', 'default') : null, [db]);
  const { data: settings } = useDoc<SchoolSettings>(settingsRef);

  const studentsQuery = useMemoFirebase(() => db ? query(collection(db, 'students'), orderBy('name', 'asc'), where('status', '==', 'Aktif')) : null, [db]);
  const { data: students = [] } = useCollection<Student>(studentsQuery);
  const previewStudent = (students && students.length > 0) ? students[0] : {
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
  } as Student;

  useEffect(() => {
    if (editingTemplate) {
      const isPortrait = editingTemplate.type === 'ID_CARD';
      const defEls = isPortrait ? DEFAULT_ELEMENTS_POTRET : DEFAULT_ELEMENTS_LANSKAP;
      const defElsBack = isPortrait ? DEFAULT_ELEMENTS_POTRET : { ...DEFAULT_ELEMENTS_LANSKAP, photo: { ...DEFAULT_ELEMENTS_LANSKAP.photo, x: 15 }, info: { ...DEFAULT_ELEMENTS_LANSKAP.info, x: 90 }, qr: { ...DEFAULT_ELEMENTS_LANSKAP.qr, x: 275 } };

      const DEFAULT_CONFIG = {
        front: { 
          headerBg: isPortrait ? '#1B3C33' : '#2E50B8', bodyBg: '#ffffff', footerBg: isPortrait ? '#10B981' : '#4FBFDD', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif',
          elements: { ...defEls },
          watermark: { ...DEFAULT_WATERMARK }
        },
        back: { 
          headerBg: isPortrait ? '#1B3C33' : '#2E50B8', bodyBg: '#ffffff', footerBg: isPortrait ? '#f8fafc' : '#4FBFDD', textColor: '#334155', bgImage: '', fontFamily: 'Inter, sans-serif',
          elements: { ...defElsBack },
          watermark: { ...DEFAULT_WATERMARK }
        }
      };

      try {
        const parsed = JSON.parse(editingTemplate.config_json);
        setLocalConfig({
          front: { ...DEFAULT_CONFIG.front, ...parsed.front, elements: { ...DEFAULT_CONFIG.front.elements, ...parsed.front?.elements }, watermark: { ...DEFAULT_CONFIG.front.watermark, ...parsed.front?.watermark } },
          back: { ...DEFAULT_CONFIG.back, ...parsed.back, elements: { ...DEFAULT_CONFIG.back.elements, ...parsed.back?.elements }, watermark: { ...DEFAULT_CONFIG.back.watermark, ...parsed.back?.watermark } }
        });
      } catch (e) {
        setLocalConfig(DEFAULT_CONFIG);
      }
    }
  }, [editingTemplate]);

  const handleAddTemplate = () => {
    if (!newTemplateName.trim() || !db) return;
    const isPortrait = newTemplateType === 'ID_CARD';
    const initialConfig = {
      front: { headerBg: isPortrait ? '#1B3C33' : '#2E50B8', bodyBg: '#ffffff', elements: isPortrait ? DEFAULT_ELEMENTS_POTRET : DEFAULT_ELEMENTS_LANSKAP },
      back: { headerBg: isPortrait ? '#1B3C33' : '#2E50B8', bodyBg: '#ffffff', elements: isPortrait ? DEFAULT_ELEMENTS_POTRET : DEFAULT_ELEMENTS_LANSKAP }
    };

    const newTemplate = {
      name: newTemplateName,
      type: newTemplateType,
      config_json: JSON.stringify(initialConfig),
      is_active: false,
      preview_color: newTemplateType === 'STUDENT_CARD' ? 'bg-blue-600' : (newTemplateType === 'EXAM_CARD' ? 'bg-orange-500' : 'bg-emerald-800')
    };

    addDoc(collection(db, 'templates'), newTemplate)
      .then(() => {
        setIsAddOpen(false);
        setNewTemplateName('');
        toast({ title: "Template Dibuat", description: "Varian desain baru telah tersimpan di cloud." });
      });
  };

  const handleToggleActive = async (id: string, type: TemplateType) => {
    if (!db) return;
    const q = query(collection(db, 'templates'), where('type', '==', type));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await updateDoc(doc(db, 'templates', d.id), { is_active: d.id === id });
    }
    toast({ title: "Template Diaktifkan", description: "Desain kartu berhasil diperbarui." });
  };

  const handleSaveConfig = () => {
    if (!editingTemplate || !localConfig || !db) return;
    updateDoc(doc(db, 'templates', editingTemplate.id), { config_json: JSON.stringify(localConfig) })
      .then(() => {
        setIsConfigOpen(false);
        toast({ title: "Visual Disimpan", description: "Tata letak kartu telah diperbarui." });
      });
  };

  const handleDeleteConfirm = () => {
    if (!templateToDelete || !db) return;
    deleteDoc(doc(db, 'templates', templateToDelete))
      .then(() => {
        setTemplateToDelete(null);
        toast({ title: "Dihapus", description: "Template telah dihapus dari cloud." });
      });
  };

  if (loadingTemplates || !settings) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
       <Loader2 className="h-10 w-10 animate-spin text-primary" />
       <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Menghubungkan ke Cloud Templates...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary tracking-tighter uppercase">Template Desain</h1>
          <p className="text-muted-foreground font-medium">Visual Editor berbasis Cloud Firestore.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-xl shadow-primary/20 rounded-2xl h-11 px-8">
          <Plus className="h-4 w-4" /> BUAT VARIAN DESAIN
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(templates || []).map((template) => (
          <Card key={template.id} className={cn(
            "overflow-hidden border-4 transition-all rounded-[3rem] shadow-sm",
            template.is_active ? "border-primary bg-primary/5" : "border-transparent bg-white"
          )}>
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-center">
                <div className={cn("p-4 rounded-2xl text-white shadow-lg", template.preview_color || 'bg-slate-400')}>
                  <Layout className="h-6 w-6" />
                </div>
                <div className="flex gap-2">
                   {!template.is_active && (
                     <Button variant="ghost" size="icon" onClick={() => setTemplateToDelete(template.id)} className="text-destructive">
                       <Trash2 className="h-5 w-5" />
                     </Button>
                   )}
                   {template.is_active && <Badge className="bg-primary text-white">AKTIF</Badge>}
                </div>
              </div>
              <CardTitle className="mt-6 font-black uppercase">{template.name}</CardTitle>
              <CardDescription className="uppercase text-[9px] font-black tracking-widest">{template.type}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="flex gap-3">
                <Button className="flex-1 h-14 rounded-2xl font-black uppercase" onClick={() => handleToggleActive(template.id, template.type)} disabled={template.is_active}>
                  AKTIFKAN
                </Button>
                <Button variant="outline" className="h-14 w-14 rounded-2xl border-2" onClick={() => { setEditingTemplate(template); setIsConfigOpen(true); }}>
                  <Palette className="h-6 w-6 text-primary" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="!max-w-[95vw] md:!max-w-7xl h-[95vh] p-0 flex flex-col rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
          <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
             <h2 className="text-2xl font-black uppercase">Visual Cloud Editor</h2>
             <Button onClick={handleSaveConfig} className="bg-primary hover:bg-primary/90 h-12 px-10 rounded-xl font-black">SIMPAN KE CLOUD</Button>
          </div>
          <div className="flex-1 overflow-auto bg-slate-100 p-10 flex items-center justify-center">
             {localConfig && editingTemplate && (
               <div className="scale-150 origin-center">
                  {editingTemplate.type === 'STUDENT_CARD' && <StudentCardVisual student={previewStudent} settings={settings} side={activeSide} template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />}
                  {editingTemplate.type === 'EXAM_CARD' && <ExamCardVisual student={previewStudent} settings={settings} side={activeSide} template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />}
                  {editingTemplate.type === 'ID_CARD' && <IdCardVisual student={previewStudent} settings={settings} side={activeSide} template={{...editingTemplate, config_json: JSON.stringify(localConfig)}} />}
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-md">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase">Tambah Varian</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label>Nama Template</Label>
              <Input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="Modern Red Premium" className="h-14 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Label>Jenis Kartu</Label>
              <Select value={newTemplateType} onValueChange={(v: any) => setNewTemplateType(v)}>
                <SelectTrigger className="h-14 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT_CARD">Kartu Pelajar</SelectItem>
                  <SelectItem value="EXAM_CARD">Kartu Ujian</SelectItem>
                  <SelectItem value="ID_CARD">ID Card Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddTemplate} className="w-full h-14 rounded-2xl font-black">DAFTARKAN KE CLOUD</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!templateToDelete} onOpenChange={o => !o && setTemplateToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-10">
          <AlertDialogHeader><AlertDialogTitle className="text-2xl font-black">Hapus Template?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 px-8">BATAL</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-white rounded-2xl h-12 px-8">HAPUS DARI CLOUD</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
