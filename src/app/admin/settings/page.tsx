
"use client";

import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/app/lib/db';
import { SchoolSettings } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Upload, Camera, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const db = getDB();
    setSettings(db.school_settings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    // Simulasi jeda agar user tahu ada proses
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const db = getDB();
      db.school_settings = { ...settings };
      saveDB(db);
      
      toast({ 
        title: "Perubahan Tersimpan", 
        description: "Seluruh konfigurasi sekolah berhasil diperbarui.",
      });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Gagal Menyimpan", 
        description: "Terjadi kesalahan sistem saat menyimpan data." 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (field: keyof SchoolSettings, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setSettings(prev => prev ? ({ ...prev, [field]: result }) : null);
      toast({ title: "Gambar Dimuat", description: "Klik Simpan Perubahan untuk mengaktifkan." });
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (field: keyof SchoolSettings, url: string) => {
    setSettings(prev => prev ? ({ ...prev, [field]: url }) : null);
  };

  const updateSetting = (field: keyof SchoolSettings, value: any) => {
    setSettings(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  if (!settings) return (
    <div className="h-full flex items-center justify-center">
       <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary tracking-tight uppercase">Settings Center</h1>
          <p className="text-muted-foreground font-medium">Manajemen aset visual, legalitas, dan aturan kartu.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="gap-2 h-14 px-10 shadow-xl shadow-primary/20 min-w-[200px] rounded-2xl text-xs font-black uppercase tracking-widest"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {isSaving ? 'MEMPROSES...' : 'SIMPAN PERUBAHAN'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-tight">Identitas & Legalitas</CardTitle>
              <CardDescription>Detail utama sekolah dan informasi Kepala Sekolah.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nama Institusi / Sekolah</Label>
                <Input 
                  value={settings.school_name} 
                  onChange={e => updateSetting('school_name', e.target.value)} 
                  className="h-12 rounded-xl" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Alamat Operasional</Label>
                <Textarea 
                  value={settings.address} 
                  onChange={e => updateSetting('address', e.target.value)} 
                  className="min-h-[100px] rounded-xl" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nama Kepala Sekolah</Label>
                  <Input 
                    value={settings.principal_name} 
                    onChange={e => updateSetting('principal_name', e.target.value)} 
                    className="h-12 rounded-xl" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">NIP Kepala Sekolah</Label>
                  <Input 
                    value={settings.principal_nip} 
                    onChange={e => updateSetting('principal_nip', e.target.value)} 
                    className="h-12 rounded-xl" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-tight">Aturan & Ketentuan Kartu</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-14 bg-transparent border-b rounded-none">
                  <TabsTrigger value="student" className="font-bold text-xs uppercase">Pelajar</TabsTrigger>
                  <TabsTrigger value="exam" className="font-bold text-xs uppercase">Ujian</TabsTrigger>
                  <TabsTrigger value="id" className="font-bold text-xs uppercase">ID Card</TabsTrigger>
                </TabsList>
                <div className="p-6">
                  <TabsContent value="student" className="mt-0 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Ketentuan Kartu Pelajar</Label>
                    <Textarea 
                      className="min-h-[150px] font-mono text-xs rounded-xl" 
                      value={settings.terms_student} 
                      onChange={e => updateSetting('terms_student', e.target.value)} 
                    />
                  </TabsContent>
                  <TabsContent value="exam" className="mt-0 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Ketentuan Kartu Ujian</Label>
                    <Textarea 
                      className="min-h-[150px] font-mono text-xs rounded-xl" 
                      value={settings.terms_exam} 
                      onChange={e => updateSetting('terms_exam', e.target.value)} 
                    />
                  </TabsContent>
                  <TabsContent value="id" className="mt-0 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Ketentuan ID Card Umum</Label>
                    <Textarea 
                      className="min-h-[150px] font-mono text-xs rounded-xl" 
                      value={settings.terms_id} 
                      onChange={e => updateSetting('terms_id', e.target.value)} 
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-tight">Aset Visual</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               <AssetUploader 
                  label="Logo Sekolah (Kiri)" 
                  image={settings.logo_left} 
                  onUpload={e => handleFileUpload('logo_left', e)} 
                  onUrlChange={url => handleUrlChange('logo_left', url)}
                  showFront={settings.student_show_logo_front}
                  onShowFrontChange={v => updateSetting('student_show_logo_front', v)}
                  showBack={settings.student_show_logo_back}
                  onShowBackChange={v => updateSetting('student_show_logo_back', v)}
                />
                <AssetUploader 
                  label="Logo Kanan (Tut Wuri)" 
                  image={settings.logo_right} 
                  onUpload={e => handleFileUpload('logo_right', e)} 
                  onUrlChange={url => handleUrlChange('logo_right', url)}
                  showFront={settings.student_show_logo_right_front}
                  onShowFrontChange={v => updateSetting('student_show_logo_right_front', v)}
                  showBack={settings.student_show_logo_right_back}
                  onShowBackChange={v => updateSetting('student_show_logo_right_back', v)}
                />
                <AssetUploader 
                  label="Tanda Tangan" 
                  image={settings.signature_image} 
                  onUpload={e => handleFileUpload('signature_image', e)} 
                  onUrlChange={url => handleUrlChange('signature_image', url)}
                  aspect="wide"
                  showFront={settings.student_show_sig_front}
                  onShowFrontChange={v => updateSetting('student_show_sig_front', v)}
                  showBack={settings.student_show_sig_back}
                  onShowBackChange={v => updateSetting('student_show_sig_back', v)}
                />
                <AssetUploader 
                  label="Stempel" 
                  image={settings.stamp_image} 
                  onUpload={e => handleFileUpload('stamp_image', e)} 
                  onUrlChange={url => handleUrlChange('stamp_image', url)}
                  showFront={settings.student_show_stamp_front}
                  onShowFrontChange={v => updateSetting('student_show_stamp_front', v)}
                  showBack={settings.student_show_stamp_back}
                  onShowBackChange={v => updateSetting('student_show_stamp_back', v)}
                />
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
  onUrlChange,
  aspect = 'square',
  showFront,
  onShowFrontChange,
  showBack,
  onShowBackChange
}: { 
  label: string, 
  image: string, 
  onUpload: (e: any) => void,
  onUrlChange: (url: string) => void,
  aspect?: 'square' | 'wide',
  showFront: boolean,
  onShowFrontChange: (v: boolean) => void,
  showBack: boolean,
  onShowBackChange: (v: boolean) => void
}) {
  return (
    <div className="space-y-4 p-5 border-2 border-slate-100 rounded-[2rem] bg-white">
      <div className="flex justify-between items-center">
        <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">{label}</Label>
      </div>
      
      <div className={cn(
        "relative bg-slate-50 border-2 border-dashed rounded-2xl overflow-hidden flex items-center justify-center group transition-all",
        aspect === 'square' ? "aspect-square" : "aspect-[2.5/1]"
      )}>
        {image ? (
          <>
            <Image src={image} alt={label} fill className="object-contain p-2" unoptimized />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Label className="cursor-pointer bg-white text-black p-3 rounded-full shadow-lg">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
              </Label>
            </div>
          </>
        ) : (
          <Label className="cursor-pointer flex flex-col items-center gap-2 text-slate-300 p-4">
            <Upload className="h-6 w-6" />
            <span className="text-[9px] font-black uppercase">UNGGAH FILE</span>
            <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
          </Label>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1">
          <LinkIcon className="h-3 w-3" /> Link URL Gambar
        </Label>
        <Input 
          placeholder="https://..." 
          value={image && image.startsWith('data:') ? '' : (image || '')}
          onChange={(e) => onUrlChange(e.target.value)}
          className="text-[10px] h-10 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
         <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-xl">
           <span className="text-[9px] font-black uppercase text-slate-500">Depan</span>
           <Switch checked={showFront} onCheckedChange={onShowFrontChange} className="scale-75" />
         </div>
         <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-xl">
           <span className="text-[9px] font-black uppercase text-slate-500">Belakang</span>
           <Switch checked={showBack} onCheckedChange={onShowBackChange} className="scale-75" />
         </div>
      </div>
    </div>
  );
}
