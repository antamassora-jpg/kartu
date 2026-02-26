"use client";

import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/app/lib/db';
import { CardTemplate } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout, Palette, Settings2, CheckCircle2, Copy, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);

  useEffect(() => {
    setTemplates(getDB().templates);
  }, []);

  const handleToggleActive = (id: string) => {
    const db = getDB();
    const type = db.templates.find(t => t.id === id)?.type;
    
    // Inactive all in same type, then active this one
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary">Template Kartu</h1>
        <p className="text-muted-foreground">Kustomisasi desain kartu pelajar dan kartu ujian.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className={`overflow-hidden border-2 transition-all ${template.is_active ? 'border-primary shadow-md' : 'border-transparent'}`}>
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                  <Layout className="h-5 w-5 text-primary" />
                </div>
                {template.is_active && (
                  <Badge className="gap-1 bg-primary">
                    <CheckCircle2 className="h-3 w-3" /> Digunakan
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <CardDescription>Tipe: {template.type === 'STUDENT_CARD' ? 'Kartu Pelajar' : 'Kartu Ujian'}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center border-2 border-dashed relative group">
                <div className="text-center p-4">
                   <Palette className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                   <p className="text-xs text-muted-foreground">Preview Visual Template</p>
                </div>
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button size="sm" variant="secondary" className="gap-2">
                    <Palette className="h-4 w-4" /> Buka Editor
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 gap-2" 
                  disabled={template.is_active}
                  onClick={() => handleToggleActive(template.id)}
                >
                  <CheckCircle2 className="h-4 w-4" /> Setel Aktif
                </Button>
                <Button variant="outline" size="icon" title="Duplikat">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" title="Hapus">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="pt-4 border-t flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                <div className="flex items-center gap-1">
                  <Settings2 className="h-3 w-3" /> Configured
                </div>
                <div>Last Edit: 2 hari lalu</div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-2 border-dashed flex flex-col items-center justify-center py-12 gap-4 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Plus className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h4 className="font-bold">Tambah Template Baru</h4>
            <p className="text-xs text-muted-foreground">Mulai dari kanvas kosong</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
