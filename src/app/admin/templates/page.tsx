
"use client";

import { useState } from 'react';
import { CardTemplate, TemplateType } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, 
  Plus, 
  Trash2,
  Loader2
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';

export default function TemplatesPage() {
  const db = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<TemplateType>('STUDENT_CARD');

  const templatesQuery = useMemoFirebase(() => db ? collection(db, 'templates') : null, [db]);
  const { data: templates = [], isLoading } = useCollection<CardTemplate>(templatesQuery);

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
       <p className="text-xs font-black uppercase text-muted-foreground">Memuat Template...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary uppercase">Template Desain</h1>
          <p className="text-muted-foreground font-medium">Daftar desain kartu yang tersedia di sistem.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 rounded-2xl h-11 px-8">
          <Plus className="h-4 w-4" /> TAMBAH TEMPLATE
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(templates || []).map((template) => (
          <Card key={template.id} className={`overflow-hidden border-4 transition-all rounded-[2rem] ${template.is_active ? "border-primary" : "border-transparent"}`}>
            <CardHeader className="p-6">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl text-white ${template.preview_color || 'bg-slate-400'}`}>
                  <Layout className="h-5 w-5" />
                </div>
                {template.is_active && <Badge className="bg-primary">AKTIF</Badge>}
              </div>
              <CardTitle className="mt-4 font-bold uppercase text-sm">{template.name}</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold">{template.type}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 flex gap-2">
              <Button 
                className="flex-1 rounded-xl text-[10px] font-black uppercase" 
                onClick={() => handleToggleActive(template.id, template.type)} 
                disabled={template.is_active}
              >
                {template.is_active ? 'SEDANG DIGUNAKAN' : 'AKTIFKAN'}
              </Button>
              {!template.is_active && (
                <Button variant="outline" size="icon" onClick={() => handleDelete(template.id)} className="text-destructive rounded-xl">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-[2rem] max-w-md">
          <DialogHeader><DialogTitle className="uppercase font-black">Tambah Varian</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label>Nama Template</Label>
              <Input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="Contoh: Modern Blue" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Jenis Kartu</Label>
              <Select value={newTemplateType} onValueChange={(v: any) => setNewTemplateType(v)}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT_CARD">Kartu Pelajar</SelectItem>
                  <SelectItem value="EXAM_CARD">Kartu Ujian</SelectItem>
                  <SelectItem value="ID_CARD">ID Card Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddTemplate} className="w-full h-12 rounded-xl font-black">SIMPAN DATA</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
