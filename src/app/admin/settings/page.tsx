"use client";

import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/app/lib/db';
import { SchoolSettings } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Sparkles, Upload, Camera, CreditCard, Award, Contact } from 'lucide-react';
import { refineCardTerms } from '@/ai/flows/refine-card-terms-flow';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

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
      toast({ title: "Berhasil", description: "Aset telah diperbarui." });
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
          <p className="text-muted-foreground">Kelola identitas, ketentuan, dan aset visual tiap kartu.</p>
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
              <CardDescription>Informasi utama yang akan tampil pada kop surat dan kartu.</CardDescription>
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
              <CardDescription>Teks tata tertib di bagian belakang setiap jenis kartu.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12">
                  <TabsTrigger value="student" className="data-[state=active]:bg-white gap-2 h-full rounded-none border-r">
                    <CreditCard className="h-3.5 w-3.5" /> Pelajar
                  </TabsTrigger>
                  <TabsTrigger value="exam" className="data-[state=active]:bg-white gap-2 h-full rounded-none border-r">
                    <Award className="h-3.5 w-3.5" /> Ujian
                  </TabsTrigger>
                  <TabsTrigger value="id" className="data-[state=active]:bg-white gap-2 h-full rounded-none">
                    <Contact className="h-3.5 w-3.5" /> ID Card
                  </TabsTrigger>
                </TabsList>
                <div className="p-6">
                  <TabsContent value="student" className="mt-0">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Ketentuan Kartu Pelajar</Label>
                      <Button variant="outline" size="sm" className="gap-2 text-secondary border-secondary h-8" onClick={() => handleAiRefine('terms_student')} disabled={isRefining['terms_student']}>
                        <Sparkles className="h-3 w-3" /> AI Refine
                      </Button>
                    </div>
                    <Textarea className="min-h-[120px] font-mono text-sm" value={settings.terms_student} onChange={e => setSettings({...settings, terms_student: e.target.value})} />
                  </TabsContent>
                  <TabsContent value="exam" className="mt-0">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Ketentuan Kartu Ujian</Label>
                      <Button variant="outline" size="sm" className="gap-2 text-secondary border-secondary h-8" onClick={() => handleAiRefine('terms_exam')} disabled={isRefining['terms_exam']}>
                        <Sparkles className="h-3 w-3" /> AI Refine
                      </Button>
                    </div>
                    <Textarea className="min-h-[120px] font-mono text-sm" value={settings.terms_exam} onChange={e => setSettings({...settings, terms_exam: e.target.value})} />
                  </TabsContent>
                  <TabsContent value="id" className="mt-0">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Ketentuan ID Card</Label>
                      <Button variant="outline" size="sm" className="gap-2 text-secondary border-secondary h-8" onClick={() => handleAiRefine('terms_id')} disabled={isRefining['terms_id']}>
                        <Sparkles className="h-3 w-3" /> AI Refine
                      </Button>
                    </div>
                    <Textarea className="min-h-[120px] font-mono text-sm" value={settings.terms_id} onChange={e => setSettings({...settings, terms_id: e.target.value})} />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-orange-200/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="text-lg">Aset & Identitas Visual</CardTitle>
              <CardDescription>Upload Logo, TTD, dan Stempel serta atur penempatannya.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12">
                  <TabsTrigger value="student" className="data-[state=active]:bg-white flex-1 h-full rounded-none border-r text-[10px]">Pelajar</TabsTrigger>
                  <TabsTrigger value="exam" className="data-[state=active]:bg-white flex-1 h-full rounded-none border-r text-[10px]">Ujian</TabsTrigger>
                  <TabsTrigger value="id" className="data-[state=active]:bg-white flex-1 h-full rounded-none text-[10px]">ID Card</TabsTrigger>
                </TabsList>
                
                <div className="p-6 space-y-6">
                  {/* Student Config */}
                  <TabsContent value="student" className="mt-0 space-y-6">
                    <AssetUploader 
                      label="Logo Kiri (Sekolah)" 
                      image={settings.logo_left} 
                      onUpload={e => handleFileUpload('logo_left', e)} 
                      showFront={settings.student_show_logo_front}
                      onShowFrontChange={v => setSettings({...settings, student_show_logo_front: v})}
                      showBack={settings.student_show_logo_back}
                      onShowBackChange={v => setSettings({...settings, student_show_logo_back: v})}
                    />
                    <AssetUploader 
                      label="Logo Kanan (Tut Wuri)" 
                      image={settings.logo_right} 
                      onUpload={e => handleFileUpload('logo_right', e)} 
                      showFront={settings.student_show_logo_right_front}
                      onShowFrontChange={v => setSettings({...settings, student_show_logo_right_front: v})}
                      showBack={settings.student_show_logo_right_back}
                      onShowBackChange={v => setSettings({...settings, student_show_logo_right_back: v})}
                    />
                    <AssetUploader 
                      label="Tanda Tangan" 
                      image={settings.signature_image} 
                      onUpload={e => handleFileUpload('signature_image', e)} 
                      aspect="wide"
                      showFront={settings.student_show_sig_front}
                      onShowFrontChange={v => setSettings({...settings, student_show_sig_front: v})}
                      showBack={settings.student_show_sig_back}
                      onShowBackChange={v => setSettings({...settings, student_show_sig_back: v})}
                    />
                    <AssetUploader 
                      label="Stempel" 
                      image={settings.stamp_image} 
                      onUpload={e => handleFileUpload('stamp_image', e)} 
                      showFront={settings.student_show_stamp_front}
                      onShowFrontChange={v => setSettings({...settings, student_show_stamp_front: v})}
                      showBack={settings.student_show_stamp_back}
                      onShowBackChange={v => setSettings({...settings, student_show_stamp_back: v})}
                    />
                  </TabsContent>

                  {/* Exam Config */}
                  <TabsContent value="exam" className="mt-0 space-y-6">
                    <AssetUploader 
                      label="Logo Kiri (Sekolah)" 
                      image={settings.logo_left_exam} 
                      onUpload={e => handleFileUpload('logo_left_exam', e)} 
                      showFront={settings.exam_show_logo_front}
                      onShowFrontChange={v => setSettings({...settings, exam_show_logo_front: v})}
                      showBack={settings.exam_show_logo_back}
                      onShowBackChange={v => setSettings({...settings, exam_show_logo_back: v})}
                    />
                    <AssetUploader 
                      label="Logo Kanan (Tut Wuri)" 
                      image={settings.logo_right_exam} 
                      onUpload={e => handleFileUpload('logo_right_exam', e)} 
                      showFront={settings.exam_show_logo_right_front}
                      onShowFrontChange={v => setSettings({...settings, exam_show_logo_right_front: v})}
                      showBack={settings.exam_show_logo_right_back}
                      onShowBackChange={v => setSettings({...settings, exam_show_logo_right_back: v})}
                    />
                    <AssetUploader 
                      label="Tanda Tangan" 
                      image={settings.signature_exam} 
                      onUpload={e => handleFileUpload('signature_exam', e)} 
                      aspect="wide"
                      showFront={settings.exam_show_sig_front}
                      onShowFrontChange={v => setSettings({...settings, exam_show_sig_front: v})}
                      showBack={settings.exam_show_sig_back}
                      onShowBackChange={v => setSettings({...settings, exam_show_sig_back: v})}
                    />
                    <AssetUploader 
                      label="Stempel" 
                      image={settings.stamp_exam} 
                      onUpload={e => handleFileUpload('stamp_exam', e)} 
                      showFront={settings.exam_show_stamp_front}
                      onShowFrontChange={v => setSettings({...settings, exam_show_stamp_front: v})}
                      showBack={settings.exam_show_stamp_back}
                      onShowBackChange={v => setSettings({...settings, exam_show_stamp_back: v})}
                    />
                  </TabsContent>

                  {/* ID Config */}
                  <TabsContent value="id" className="mt-0 space-y-6">
                    <AssetUploader 
                      label="Logo Utama" 
                      image={settings.logo_left_id} 
                      onUpload={e => handleFileUpload('logo_left_id', e)} 
                      showFront={settings.id_show_logo_front}
                      onShowFrontChange={v => setSettings({...settings, id_show_logo_front: v})}
                      showBack={settings.id_show_logo_back}
                      onShowBackChange={v => setSettings({...settings, id_show_logo_back: v})}
                    />
                    <AssetUploader 
                      label="Tanda Tangan" 
                      image={settings.signature_id} 
                      onUpload={e => handleFileUpload('signature_id', e)} 
                      aspect="wide"
                      showFront={settings.id_show_sig_front}
                      onShowFrontChange={v => setSettings({...settings, id_show_sig_front: v})}
                      showBack={settings.id_show_sig_back}
                      onShowBackChange={v => setSettings({...settings, id_show_sig_back: v})}
                    />
                    <AssetUploader 
                      label="Stempel" 
                      image={settings.stamp_id} 
                      onUpload={e => handleFileUpload('stamp_id', e)} 
                      showFront={settings.id_show_stamp_front}
                      onShowFrontChange={v => setSettings({...settings, id_show_stamp_front: v})}
                      showBack={settings.id_show_stamp_back}
                      onShowBackChange={v => setSettings({...settings, id_show_stamp_back: v})}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AssetUploader({ 
  label, 
  image, 
  onUpload, 
  aspect = 'square',
  showFront,
  onShowFrontChange,
  showBack,
  onShowBackChange
}: { 
  label: string, 
  image: string, 
  onUpload: (e: any) => void,
  aspect?: 'square' | 'wide',
  showFront: boolean,
  onShowFrontChange: (v: boolean) => void,
  showBack: boolean,
  onShowBackChange: (v: boolean) => void
}) {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-white shadow-sm">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-bold uppercase text-slate-700">{label}</Label>
      </div>
      
      <div className={cn(
        "relative bg-muted/20 border-2 border-dashed rounded-xl overflow-hidden flex items-center justify-center group transition-all hover:bg-muted/30 hover:border-primary/30",
        aspect === 'square' ? "aspect-square" : "aspect-[2.5/1]"
      )}>
        {image ? (
          <>
            <Image src={image} alt={label} fill className="object-contain p-2" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Label className="cursor-pointer bg-white text-black p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
              </Label>
            </div>
          </>
        ) : (
          <Label className="cursor-pointer flex flex-col items-center gap-1 text-muted-foreground p-4">
            <Upload className="h-5 w-5" />
            <span className="text-[9px] font-bold">UPLOAD</span>
            <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
          </Label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-2">
         <div className="flex items-center justify-between gap-2 px-2 py-1 bg-slate-50 rounded-lg">
           <span className="text-[9px] font-bold uppercase text-slate-500">Depan</span>
           <Switch checked={showFront} onCheckedChange={onShowFrontChange} className="scale-75" />
         </div>
         <div className="flex items-center justify-between gap-2 px-2 py-1 bg-slate-50 rounded-lg">
           <span className="text-[9px] font-bold uppercase text-slate-500">Belakang</span>
           <Switch checked={showBack} onCheckedChange={onShowBackChange} className="scale-75" />
         </div>
      </div>
    </div>
  );
}
