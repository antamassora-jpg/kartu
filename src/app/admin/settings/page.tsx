"use client";

import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/app/lib/db';
import { SchoolSettings } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Upload, Camera, Loader2, Link as LinkIcon, RefreshCw, Layout, FileText, ClipboardList } from 'lucide-react';
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
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const db = getDB();
      db.school_settings = { ...settings };
      saveDB(db);
      
      toast({ 
        title: "Konfigurasi Disimpan", 
        description: "Seluruh data identitas, aturan, dan tata letak telah diperbarui.",
      });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Gagal Menyimpan", 
        description: "Terjadi kesalahan sistem saat mencoba memperbarui database." 
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
      toast({ title: "Aset Dimuat", description: "Klik 'Simpan Perubahan' untuk mengaktifkan aset baru ini." });
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
    <div className="h-full flex items-center justify-center py-40">
       <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary tracking-tight uppercase">Settings Center</h1>
          <p className="text-muted-foreground font-medium">Manajemen konten, aturan kartu, dan tata letak identitas.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="gap-2 h-14 px-10 shadow-2xl shadow-primary/20 min-w-[220px] rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {isSaving ? 'SEDANG MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Identitas & Legalitas */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Identitas & Legalitas Sekolah
              </CardTitle>
              <CardDescription>Informasi utama institusi dan data Kepala Sekolah.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nama Institusi / Sekolah</Label>
                <Input 
                  value={settings.school_name} 
                  onChange={e => updateSetting('school_name', e.target.value)} 
                  className="h-12 rounded-xl border-slate-200" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Alamat Operasional Lengkap</Label>
                <Textarea 
                  value={settings.address} 
                  onChange={e => updateSetting('address', e.target.value)} 
                  className="min-h-[80px] rounded-xl border-slate-200" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nama Kepala Sekolah</Label>
                  <Input 
                    value={settings.principal_name} 
                    onChange={e => updateSetting('principal_name', e.target.value)} 
                    className="h-12 rounded-xl border-slate-200" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">NIP Kepala Sekolah</Label>
                  <Input 
                    value={settings.principal_nip} 
                    onChange={e => updateSetting('principal_nip', e.target.value)} 
                    className="h-12 rounded-xl border-slate-200" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aturan & Tata Tertib */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" /> Aturan & Tata Tertib Kartu
              </CardTitle>
              <CardDescription>Teks yang akan ditampilkan pada sisi belakang masing-masing kartu.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="pelajar" className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-14 bg-transparent border-b rounded-none">
                  <TabsTrigger value="pelajar" className="font-bold text-xs uppercase">Pelajar</TabsTrigger>
                  <TabsTrigger value="ujian" className="font-bold text-xs uppercase">Ujian</TabsTrigger>
                  <TabsTrigger value="id" className="font-bold text-xs uppercase">ID Card</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pelajar" className="p-8 space-y-4 mt-0">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Ketentuan Kartu Pelajar</Label>
                  <Textarea 
                    value={settings.terms_student} 
                    onChange={e => updateSetting('terms_student', e.target.value)} 
                    className="min-h-[150px] rounded-xl border-slate-200 text-sm leading-relaxed" 
                    placeholder="Masukkan poin-poin aturan penggunaan kartu pelajar..."
                  />
                </TabsContent>

                <TabsContent value="ujian" className="p-8 space-y-4 mt-0">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tata Tertib Ujian</Label>
                  <Textarea 
                    value={settings.terms_exam} 
                    onChange={e => updateSetting('terms_exam', e.target.value)} 
                    className="min-h-[150px] rounded-xl border-slate-200 text-sm leading-relaxed" 
                    placeholder="Masukkan tata tertib pelaksanaan ujian..."
                  />
                </TabsContent>

                <TabsContent value="id" className="p-8 space-y-4 mt-0">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Ketentuan ID Card Umum</Label>
                  <Textarea 
                    value={settings.terms_id} 
                    onChange={e => updateSetting('terms_id', e.target.value)} 
                    className="min-h-[150px] rounded-xl border-slate-200 text-sm leading-relaxed" 
                    placeholder="Masukkan ketentuan penggunaan kartu identitas..."
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Tata Letak Identitas */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Layout className="h-5 w-5 text-primary" /> Tata Letak Identitas Siswa
              </CardTitle>
              <CardDescription>Posisikan foto, data diri, dan barcode di sisi depan atau belakang.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="pelajar" className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-14 bg-transparent border-b rounded-none">
                  <TabsTrigger value="pelajar" className="font-bold text-xs uppercase">Pelajar</TabsTrigger>
                  <TabsTrigger value="ujian" className="font-bold text-xs uppercase">Ujian</TabsTrigger>
                  <TabsTrigger value="id" className="font-bold text-xs uppercase">ID Card</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pelajar" className="p-8 space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PlacementControl label="Foto Siswa" front={settings.student_show_photo_front} onFrontChange={v => updateSetting('student_show_photo_front', v)} back={settings.student_show_photo_back} onBackChange={v => updateSetting('student_show_photo_back', v)} />
                    <PlacementControl label="Data Identitas (Nama/NIS)" front={settings.student_show_info_front} onFrontChange={v => updateSetting('student_show_info_front', v)} back={settings.student_show_info_back} onBackChange={v => updateSetting('student_show_info_back', v)} />
                    <PlacementControl label="Barcode / QR Code" front={settings.student_show_qr_front} onFrontChange={v => updateSetting('student_show_qr_front', v)} back={settings.student_show_qr_back} onBackChange={v => updateSetting('student_show_qr_back', v)} />
                    <PlacementControl label="Masa Berlaku" front={settings.student_show_valid_front} onFrontChange={v => updateSetting('student_show_valid_front', v)} back={settings.student_show_valid_back} onBackChange={v => updateSetting('student_show_valid_back', v)} />
                  </div>
                </TabsContent>

                <TabsContent value="ujian" className="p-8 space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PlacementControl label="Foto Peserta" front={settings.exam_show_photo_front} onFrontChange={v => updateSetting('exam_show_photo_front', v)} back={settings.exam_show_photo_back} onBackChange={v => updateSetting('exam_show_photo_back', v)} />
                    <PlacementControl label="Data Peserta" front={settings.exam_show_info_front} onFrontChange={v => updateSetting('exam_show_info_front', v)} back={settings.exam_show_info_back} onBackChange={v => updateSetting('exam_show_info_back', v)} />
                    <PlacementControl label="QR Code Ujian" front={settings.exam_show_qr_front} onFrontChange={v => updateSetting('exam_show_qr_front', v)} back={settings.exam_show_qr_back} onBackChange={v => updateSetting('exam_show_qr_back', v)} />
                    <PlacementControl label="Status Berlaku" front={settings.exam_show_valid_front} onFrontChange={v => updateSetting('exam_show_valid_front', v)} back={settings.exam_show_valid_back} onBackChange={v => updateSetting('exam_show_valid_back', v)} />
                  </div>
                </TabsContent>

                <TabsContent value="id" className="p-8 space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PlacementControl label="Foto Personil" front={settings.id_show_photo_front} onFrontChange={v => updateSetting('id_show_photo_front', v)} back={settings.id_show_photo_back} onBackChange={v => updateSetting('id_show_photo_back', v)} />
                    <PlacementControl label="Data Personil" front={settings.id_show_info_front} onFrontChange={v => updateSetting('id_show_info_front', v)} back={settings.id_show_info_back} onBackChange={v => updateSetting('id_show_info_back', v)} />
                    <PlacementControl label="QR Code Corporate" front={settings.id_show_qr_front} onFrontChange={v => updateSetting('id_show_qr_front', v)} back={settings.id_show_qr_back} onBackChange={v => updateSetting('id_show_qr_back', v)} />
                    <PlacementControl label="Masa Aktif" front={settings.id_show_valid_front} onFrontChange={v => updateSetting('id_show_valid_front', v)} back={settings.id_show_valid_back} onBackChange={v => updateSetting('id_show_valid_back', v)} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-tight">Aset Institusi</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="pelajar" className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-12 bg-slate-100/50 border-b rounded-none">
                  <TabsTrigger value="pelajar" className="font-bold text-[9px] uppercase tracking-widest">Pelajar</TabsTrigger>
                  <TabsTrigger value="ujian" className="font-bold text-[9px] uppercase tracking-widest">Ujian</TabsTrigger>
                  <TabsTrigger value="idcard" className="font-bold text-[9px] uppercase tracking-widest">ID Card</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pelajar" className="p-6 space-y-6 mt-0">
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
                </TabsContent>

                <TabsContent value="ujian" className="p-6 space-y-6 mt-0">
                  <AssetUploader 
                    label="Logo Kiri (Ujian)" 
                    image={settings.logo_left_exam} 
                    onUpload={e => handleFileUpload('logo_left_exam', e)} 
                    onUrlChange={url => handleUrlChange('logo_left_exam', url)}
                    showFront={settings.exam_show_logo_front}
                    onShowFrontChange={v => updateSetting('exam_show_logo_front', v)}
                    showBack={settings.exam_show_logo_back}
                    onShowBackChange={v => updateSetting('exam_show_logo_back', v)}
                  />
                  <AssetUploader 
                    label="Logo Kanan (Ujian)" 
                    image={settings.logo_right_exam} 
                    onUpload={e => handleFileUpload('logo_right_exam', e)} 
                    onUrlChange={url => handleUrlChange('logo_right_exam', url)}
                    showFront={settings.exam_show_logo_right_front}
                    onShowFrontChange={v => updateSetting('exam_show_logo_right_front', v)}
                    showBack={settings.exam_show_logo_right_back}
                    onShowBackChange={v => updateSetting('exam_show_logo_right_back', v)}
                  />
                  <AssetUploader 
                    label="Tanda Tangan" 
                    image={settings.signature_exam} 
                    onUpload={e => handleFileUpload('signature_exam', e)} 
                    onUrlChange={url => handleUrlChange('signature_exam', url)}
                    aspect="wide"
                    showFront={settings.exam_show_sig_front}
                    onShowFrontChange={v => updateSetting('exam_show_sig_front', v)}
                    showBack={settings.exam_show_sig_back}
                    onShowBackChange={v => updateSetting('exam_show_sig_back', v)}
                  />
                  <AssetUploader 
                    label="Stempel" 
                    image={settings.stamp_exam} 
                    onUpload={e => handleFileUpload('stamp_exam', e)} 
                    onUrlChange={url => handleUrlChange('stamp_exam', url)}
                    showFront={settings.exam_show_stamp_front}
                    onShowFrontChange={v => updateSetting('exam_show_stamp_front', v)}
                    showBack={settings.exam_show_stamp_back}
                    onShowBackChange={v => updateSetting('exam_show_stamp_back', v)}
                  />
                </TabsContent>

                <TabsContent value="idcard" className="p-6 space-y-6 mt-0">
                  <AssetUploader 
                    label="Logo Kiri (ID Card)" 
                    image={settings.logo_left_id} 
                    onUpload={e => handleFileUpload('logo_left_id', e)} 
                    onUrlChange={url => handleUrlChange('logo_left_id', url)}
                    showFront={settings.id_show_logo_front}
                    onShowFrontChange={v => updateSetting('id_show_logo_front', v)}
                    showBack={settings.id_show_logo_back}
                    onShowBackChange={v => updateSetting('id_show_logo_back', v)}
                  />
                  <AssetUploader 
                    label="Logo Kanan (ID Card)" 
                    image={settings.logo_right_id} 
                    onUpload={e => handleFileUpload('logo_right_id', e)} 
                    onUrlChange={url => handleUrlChange('logo_right_id', url)}
                    showFront={settings.id_show_logo_right_front}
                    onShowFrontChange={v => updateSetting('id_show_logo_right_front', v)}
                    showBack={settings.id_show_logo_right_back}
                    onShowBackChange={v => updateSetting('id_show_logo_right_back', v)}
                  />
                  <AssetUploader 
                    label="Tanda Tangan" 
                    image={settings.signature_id} 
                    onUpload={e => handleFileUpload('signature_id', e)} 
                    onUrlChange={url => handleUrlChange('signature_id', url)}
                    aspect="wide"
                    showFront={settings.id_show_sig_front}
                    onShowFrontChange={v => updateSetting('id_show_sig_front', v)}
                    showBack={settings.id_show_sig_back}
                    onShowBackChange={v => updateSetting('id_show_sig_back', v)}
                  />
                  <AssetUploader 
                    label="Stempel" 
                    image={settings.stamp_id} 
                    onUpload={e => handleFileUpload('stamp_id', e)} 
                    onUrlChange={url => handleUrlChange('stamp_id', url)}
                    showFront={settings.id_show_stamp_front}
                    onShowFrontChange={v => updateSetting('id_show_stamp_front', v)}
                    showBack={settings.id_show_stamp_back}
                    onShowBackChange={v => updateSetting('id_show_stamp_back', v)}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PlacementControl({ 
  label, 
  front, 
  onFrontChange, 
  back, 
  onBackChange 
}: { 
  label: string, 
  front: boolean, 
  onFrontChange: (v: boolean) => void, 
  back: boolean, 
  onBackChange: (v: boolean) => void 
}) {
  return (
    <div className="p-4 border-2 border-slate-100 rounded-2xl bg-white space-y-3">
      <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-xl">
          <span className="text-[9px] font-bold uppercase text-slate-500">Depan</span>
          <Switch checked={front} onCheckedChange={onFrontChange} className="scale-75" />
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-xl">
          <span className="text-[9px] font-bold uppercase text-slate-500">Belakang</span>
          <Switch checked={back} onCheckedChange={onBackChange} className="scale-75" />
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
    <div className="space-y-4 p-5 border-2 border-slate-100 rounded-[2.5rem] bg-white transition-all hover:border-primary/20">
      <div className="flex justify-between items-center">
        <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">{label}</Label>
      </div>
      
      <div className={cn(
        "relative bg-slate-50 border-2 border-dashed rounded-3xl overflow-hidden flex items-center justify-center group transition-all",
        aspect === 'square' ? "aspect-square" : "aspect-[2.5/1]"
      )}>
        {image ? (
          <>
            <Image src={image} alt={label} fill className="object-contain p-2" unoptimized />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <Label className="cursor-pointer bg-white text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
              </Label>
              <Button variant="secondary" size="sm" className="rounded-full h-10 w-10 p-0" onClick={() => onUrlChange('')}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <Label className="cursor-pointer flex flex-col items-center gap-2 text-slate-300 p-4">
            <Upload className="h-6 w-6" />
            <span className="text-[9px] font-black uppercase tracking-widest">UNGGAH FILE</span>
            <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
          </Label>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1.5 px-1">
          <LinkIcon className="h-3 w-3" /> Link URL Foto/Logo
        </Label>
        <Input 
          placeholder="https://link-gambar.com/logo.png" 
          value={image && image.startsWith('data:') ? '' : (image || '')}
          onChange={(e) => onUrlChange(e.target.value)}
          className="text-[10px] h-11 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
         <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 rounded-2xl">
           <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Depan</span>
           <Switch checked={showFront} onCheckedChange={onShowFrontChange} className="scale-75" />
         </div>
         <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 rounded-2xl">
           <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Belakang</span>
           <Switch checked={showBack} onCheckedChange={onShowBackChange} className="scale-75" />
         </div>
      </div>
    </div>
  );
}
