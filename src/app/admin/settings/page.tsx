"use client";

import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/app/lib/db';
import { SchoolSettings } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Save, Info, Camera, Upload, Trash2, CreditCard, Award, Contact } from 'lucide-react';
import { refineCardTerms } from '@/ai/flows/refine-card-terms-flow';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [isRefining, setIsRefining] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    setSettings(getDB().school_settings);
  }, []);

  const handleSave = () => {
    if (!settings) return;
    const db = getDB();
    db.school_settings = settings;
    saveDB(db);
    toast({ title: "Tersimpan", description: "Pengaturan sekolah berhasil diperbarui." });
  };

  const handleFileUpload = (field: keyof SchoolSettings, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings({ ...settings, [field]: reader.result as string });
      toast({ title: "Berhasil", description: "File telah diunggah ke pratinjau." });
    };
    reader.readAsDataURL(file);
  };

  const handleAiRefine = async (field: 'terms_student' | 'terms_exam' | 'terms_id') => {
    if (!settings?.[field]) return;
    setIsRefining(prev => ({ ...prev, [field]: true }));
    try {
      const result = await refineCardTerms({ rawTermsText: settings[field] });
      setSettings({ ...settings, [field]: result.refinedTermsText });
      toast({ title: "AI Refined", description: "Ketentuan kartu telah diperbaiki secara otomatis." });
    } catch (err) {
      toast({ title: "Gagal", description: "Gagal memproses AI." });
    } finally {
      setIsRefining(prev => ({ ...prev, [field]: false }));
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Pengaturan Sekolah</h1>
          <p className="text-muted-foreground">Identitas sekolah, aset digital, dan legalitas kartu.</p>
        </div>
        <Button onClick={handleSave} className="gap-2 h-11 px-6 shadow-lg shadow-primary/20">
          <Save className="h-4 w-4" /> Simpan Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg">Identitas & Legalitas</CardTitle>
              <CardDescription>Informasi yang akan tampil pada kop dan legalitas kartu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Nama Institusi / Sekolah</Label>
                <Input value={settings.school_name} onChange={e => setSettings({...settings, school_name: e.target.value})} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Alamat Operasional</Label>
                <Textarea value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="min-h-[80px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Nama Kepala Sekolah</Label>
                  <Input value={settings.principal_name} onChange={e => setSettings({...settings, principal_name: e.target.value})} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">NIP Kepala Sekolah</Label>
                  <Input value={settings.principal_nip} onChange={e => setSettings({...settings, principal_nip: e.target.value})} className="h-11" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 shadow-sm overflow-hidden">
            <CardHeader className="bg-secondary/5 border-b">
              <CardTitle className="text-lg">Aturan & Ketentuan Kartu</CardTitle>
              <CardDescription>Teks tata tertib untuk setiap jenis kartu yang dicetak.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12">
                  <TabsTrigger value="student" className="data-[state=active]:bg-white gap-2 h-full rounded-none border-r">
                    <CreditCard className="h-3.5 w-3.5" /> Kartu Pelajar
                  </TabsTrigger>
                  <TabsTrigger value="exam" className="data-[state=active]:bg-white gap-2 h-full rounded-none border-r">
                    <Award className="h-3.5 w-3.5" /> Kartu Ujian
                  </TabsTrigger>
                  <TabsTrigger value="id" className="data-[state=active]:bg-white gap-2 h-full rounded-none">
                    <Contact className="h-3.5 w-3.5" /> ID Card
                  </TabsTrigger>
                </TabsList>
                <div className="p-6 space-y-4">
                  <TabsContent value="student" className="space-y-4 mt-0">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Ketentuan Kartu Pelajar</Label>
                      <Button variant="outline" size="sm" className="gap-2 text-secondary border-secondary h-8" onClick={() => handleAiRefine('terms_student')} disabled={isRefining['terms_student']}>
                        <Sparkles className="h-3 w-3" /> {isRefining['terms_student'] ? 'Memproses...' : 'AI Refine'}
                      </Button>
                    </div>
                    <Textarea 
                      className="min-h-[150px] font-mono text-sm leading-relaxed" 
                      value={settings.terms_student} 
                      onChange={e => setSettings({...settings, terms_student: e.target.value})} 
                    />
                  </TabsContent>
                  <TabsContent value="exam" className="space-y-4 mt-0">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Ketentuan Kartu Ujian</Label>
                      <Button variant="outline" size="sm" className="gap-2 text-secondary border-secondary h-8" onClick={() => handleAiRefine('terms_exam')} disabled={isRefining['terms_exam']}>
                        <Sparkles className="h-3 w-3" /> {isRefining['terms_exam'] ? 'Memproses...' : 'AI Refine'}
                      </Button>
                    </div>
                    <Textarea 
                      className="min-h-[150px] font-mono text-sm leading-relaxed" 
                      value={settings.terms_exam} 
                      onChange={e => setSettings({...settings, terms_exam: e.target.value})} 
                    />
                  </TabsContent>
                  <TabsContent value="id" className="space-y-4 mt-0">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Ketentuan ID Card Corporate</Label>
                      <Button variant="outline" size="sm" className="gap-2 text-secondary border-secondary h-8" onClick={() => handleAiRefine('terms_id')} disabled={isRefining['terms_id']}>
                        <Sparkles className="h-3 w-3" /> {isRefining['terms_id'] ? 'Memproses...' : 'AI Refine'}
                      </Button>
                    </div>
                    <Textarea 
                      className="min-h-[150px] font-mono text-sm leading-relaxed" 
                      value={settings.terms_id} 
                      onChange={e => setSettings({...settings, terms_id: e.target.value})} 
                    />
                  </TabsContent>
                </div>
              </Tabs>
              <div className="px-6 pb-6 pt-0 flex items-start gap-2 text-[10px] text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <p>Setiap kategori kartu memiliki tata tertib berbeda yang akan dicetak di bagian belakang kartu.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-orange-200/50 shadow-sm">
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="text-lg">Aset & Identitas Visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              {/* Logos */}
              <div className="grid grid-cols-2 gap-4">
                <AssetUploader 
                  label="Logo Sekolah" 
                  image={settings.logo_left} 
                  onUpload={(e) => handleFileUpload('logo_left', e)} 
                />
                <AssetUploader 
                  label="Logo Pendidikan" 
                  image={settings.logo_right} 
                  onUpload={(e) => handleFileUpload('logo_right', e)} 
                />
              </div>

              {/* TTD & Stamp */}
              <div className="space-y-6 pt-4 border-t">
                <AssetUploader 
                  label="Tanda Tangan Kepsek" 
                  image={settings.signature_image} 
                  onUpload={(e) => handleFileUpload('signature_image', e)} 
                  fullWidth
                  aspect="wide"
                />
                <AssetUploader 
                  label="Stempel Sekolah" 
                  image={settings.stamp_image} 
                  onUpload={(e) => handleFileUpload('stamp_image', e)} 
                  fullWidth
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AssetUploader({ label, image, onUpload, fullWidth = false, aspect = 'square' }: { 
  label: string, 
  image: string, 
  onUpload: (e: any) => void,
  fullWidth?: boolean,
  aspect?: 'square' | 'wide'
}) {
  return (
    <div className={fullWidth ? "w-full space-y-3" : "space-y-3"}>
      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{label}</Label>
      <div className={cn(
        "relative bg-muted/20 border-2 border-dashed rounded-xl overflow-hidden flex items-center justify-center group transition-colors hover:bg-muted/30",
        aspect === 'square' ? "aspect-square" : "aspect-[2/1]"
      )}>
        {image ? (
          <>
            <Image src={image} alt={label} fill className="object-contain p-2" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Label className="cursor-pointer bg-white text-black p-2 rounded-full shadow-lg">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
              </Label>
            </div>
          </>
        ) : (
          <Label className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <span className="text-[10px]">Pilih File</span>
            <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
          </Label>
        )}
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
