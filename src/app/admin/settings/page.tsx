
"use client";

import { useState, useEffect } from 'react';
import { SchoolSettings } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  FileText, 
  Layout, 
  ClipboardList,
  Link as LinkIcon,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { DEFAULT_SETTINGS } from '@/app/lib/db';

export default function SettingsPage() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'school_settings', 'default') : null, [db]);
  const { data: dbSettings } = useDoc<SchoolSettings>(settingsRef);
  
  const [localSettings, setLocalSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('student');

  useEffect(() => {
    if (dbSettings) {
      setLocalSettings(prev => ({ ...prev, ...dbSettings }));
    }
  }, [dbSettings]);

  const handleSave = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'school_settings', 'default'), localSettings);
      toast({ title: "Berhasil", description: "Pengaturan telah disimpan ke Cloud Firestore." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: "Terjadi kendala saat menghubungi database." });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (field: keyof SchoolSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 pb-20 max-w-[1400px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black font-headline text-[#2E50B8] tracking-tighter uppercase leading-none">Settings Center</h1>
          <p className="text-muted-foreground mt-2 font-medium">Manajemen konten, aturan kartu, dan tata letak identitas.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-[#2E50B8] hover:bg-[#1e3a8a] gap-3 shadow-xl px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: IDENTITAS & KETENTUAN */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 1. IDENTITAS & LEGALITAS */}
          <Card className="rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/30 border-b border-slate-50 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><FileText className="h-5 w-5 text-primary" /></div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Identitas & Legalitas Sekolah</CardTitle>
                  <CardDescription className="font-medium">Informasi utama institusi dan data Kepala Sekolah.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Nama Institusi / Sekolah</Label>
                <Input 
                  value={localSettings.school_name} 
                  onChange={e => updateSetting('school_name', e.target.value)} 
                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 focus-visible:ring-primary/20" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Alamat Operasional Lengkap</Label>
                <Textarea 
                  value={localSettings.address} 
                  onChange={e => updateSetting('address', e.target.value)} 
                  className="min-h-[100px] rounded-2xl bg-slate-50 border-none font-medium text-slate-600 focus-visible:ring-primary/20 leading-relaxed" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Nama Kepala Sekolah</Label>
                  <Input 
                    value={localSettings.principal_name} 
                    onChange={e => updateSetting('principal_name', e.target.value)} 
                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">NIP Kepala Sekolah</Label>
                  <Input 
                    value={localSettings.principal_nip} 
                    onChange={e => updateSetting('principal_nip', e.target.value)} 
                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. ATURAN & TATA TERTIB */}
          <Card className="rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/30 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><ClipboardList className="h-5 w-5 text-primary" /></div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Aturan & Tata Tertib Kartu</CardTitle>
                  <CardDescription className="font-medium">Teks yang akan ditampilkan pada sisi belakang masing-masing kartu.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-100/80 p-1 rounded-2xl mb-6">
                  <TabsTrigger value="student" className="rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E50B8] data-[state=active]:shadow-md">Pelajar</TabsTrigger>
                  <TabsTrigger value="exam" className="rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E50B8] data-[state=active]:shadow-md">Ujian</TabsTrigger>
                  <TabsTrigger value="id" className="rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E50B8] data-[state=active]:shadow-md">ID Card</TabsTrigger>
                </TabsList>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em] ml-1 mb-2 block">Ketentuan Kartu {activeTab.toUpperCase()}</Label>
                  <TabsContent value="student" className="mt-0">
                    <Textarea 
                      value={localSettings.terms_student} 
                      onChange={e => updateSetting('terms_student', e.target.value)} 
                      className="min-h-[180px] rounded-[1.5rem] bg-slate-50 border-none leading-relaxed p-6"
                    />
                  </TabsContent>
                  <TabsContent value="exam" className="mt-0">
                    <Textarea 
                      value={localSettings.terms_exam} 
                      onChange={e => updateSetting('terms_exam', e.target.value)} 
                      className="min-h-[180px] rounded-[1.5rem] bg-slate-50 border-none leading-relaxed p-6"
                    />
                  </TabsContent>
                  <TabsContent value="id" className="mt-0">
                    <Textarea 
                      value={localSettings.terms_id} 
                      onChange={e => updateSetting('terms_id', e.target.value)} 
                      className="min-h-[180px] rounded-[1.5rem] bg-slate-50 border-none leading-relaxed p-6"
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* 3. TATA LETAK IDENTITAS */}
          <Card className="rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/30 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><Layout className="h-5 w-5 text-primary" /></div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Tata Letak Identitas Siswa</CardTitle>
                  <CardDescription className="font-medium">Posisikan foto, data diri, dan barcode di sisi depan atau belakang.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-100/80 p-1 rounded-2xl mb-8">
                  <TabsTrigger value="student" className="rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E50B8] data-[state=active]:shadow-md">Pelajar</TabsTrigger>
                  <TabsTrigger value="exam" className="rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E50B8] data-[state=active]:shadow-md">Ujian</TabsTrigger>
                  <TabsTrigger value="id" className="rounded-xl text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E50B8] data-[state=active]:shadow-md">ID Card</TabsTrigger>
                </TabsList>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LayoutSwitch 
                    label="Foto Siswa" 
                    front={localSettings[`${activeTab}_show_photo_front` as any]} 
                    back={localSettings[`${activeTab}_show_photo_back` as any]} 
                    onFrontChange={(v) => updateSetting(`${activeTab}_show_photo_front` as any, v)}
                    onBackChange={(v) => updateSetting(`${activeTab}_show_photo_back` as any, v)}
                  />
                  <LayoutSwitch 
                    label="Data Identitas (Nama/NIS)" 
                    front={localSettings[`${activeTab}_show_info_front` as any]} 
                    back={localSettings[`${activeTab}_show_info_back` as any]} 
                    onFrontChange={(v) => updateSetting(`${activeTab}_show_info_front` as any, v)}
                    onBackChange={(v) => updateSetting(`${activeTab}_show_info_back` as any, v)}
                  />
                  <LayoutSwitch 
                    label="Barcode / QR Code" 
                    front={localSettings[`${activeTab}_show_qr_front` as any]} 
                    back={localSettings[`${activeTab}_show_qr_back` as any]} 
                    onFrontChange={(v) => updateSetting(`${activeTab}_show_qr_front` as any, v)}
                    onBackChange={(v) => updateSetting(`${activeTab}_show_qr_back` as any, v)}
                  />
                  <LayoutSwitch 
                    label="Masa Berlaku" 
                    front={localSettings[`${activeTab}_show_valid_front` as any]} 
                    back={localSettings[`${activeTab}_show_valid_back` as any]} 
                    onFrontChange={(v) => updateSetting(`${activeTab}_show_valid_front` as any, v)}
                    onBackChange={(v) => updateSetting(`${activeTab}_show_valid_back` as any, v)}
                  />
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: ASET INSTITUSI */}
        <div className="lg:col-span-5">
          <Card className="rounded-[2rem] border-none shadow-xl ring-1 ring-slate-100 overflow-hidden bg-white">
            <CardHeader className="bg-[#F8FAFC] border-b border-slate-50 pb-6">
              <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Aset Institusi</CardTitle>
            </CardHeader>
            <div className="px-6 pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100/80 p-1 rounded-xl">
                  <TabsTrigger value="student" className="rounded-lg text-[9px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E50B8] data-[state=active]:shadow-sm">Pelajar</TabsTrigger>
                  <TabsTrigger value="exam" className="rounded-lg text-[9px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E50B8] data-[state=active]:shadow-sm">Ujian</TabsTrigger>
                  <TabsTrigger value="id" className="rounded-lg text-[9px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E50B8] data-[state=active]:shadow-sm">ID Card</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardContent className="p-6 space-y-10">
              
              <AssetCard 
                label="Logo Sekolah (Kiri)" 
                value={activeTab === 'exam' ? localSettings.logo_left_exam : (activeTab === 'id' ? localSettings.logo_left_id : localSettings.logo_left)}
                onChange={(val) => updateSetting(activeTab === 'exam' ? 'logo_left_exam' : (activeTab === 'id' ? 'logo_left_id' : 'logo_left'), val)}
                front={localSettings[`${activeTab}_show_logo_front` as any]}
                back={localSettings[`${activeTab}_show_logo_back` as any]}
                onFrontToggle={(v) => updateSetting(`${activeTab}_show_logo_front` as any, v)}
                onBackToggle={(v) => updateSetting(`${activeTab}_show_logo_back` as any, v)}
              />

              <AssetCard 
                label="Logo Kanan (Tut Wuri)" 
                value={activeTab === 'exam' ? localSettings.logo_right_exam : (activeTab === 'id' ? localSettings.logo_right_id : localSettings.logo_right)}
                onChange={(val) => updateSetting(activeTab === 'exam' ? 'logo_right_exam' : (activeTab === 'id' ? 'logo_right_id' : 'logo_right'), val)}
                front={localSettings[`${activeTab}_show_logo_right_front` as any]}
                back={localSettings[`${activeTab}_show_logo_right_back` as any]}
                onFrontToggle={(v) => updateSetting(`${activeTab}_show_logo_right_front` as any, v)}
                onBackToggle={(v) => updateSetting(`${activeTab}_show_logo_right_back` as any, v)}
              />

              <AssetCard 
                label="Tanda Tangan" 
                value={activeTab === 'exam' ? localSettings.signature_exam : (activeTab === 'id' ? localSettings.signature_id : localSettings.signature_image)}
                onChange={(val) => updateSetting(activeTab === 'exam' ? 'signature_exam' : (activeTab === 'id' ? 'signature_id' : 'signature_image'), val)}
                front={localSettings[`${activeTab}_show_sig_front` as any]}
                back={localSettings[`${activeTab}_show_sig_back` as any]}
                onFrontToggle={(v) => updateSetting(`${activeTab}_show_sig_front` as any, v)}
                onBackToggle={(v) => updateSetting(`${activeTab}_show_sig_back` as any, v)}
              />

              <AssetCard 
                label="Stempel" 
                value={activeTab === 'exam' ? localSettings.stamp_exam : (activeTab === 'id' ? localSettings.stamp_id : localSettings.stamp_image)}
                onChange={(val) => updateSetting(activeTab === 'exam' ? 'stamp_exam' : (activeTab === 'id' ? 'stamp_id' : 'stamp_image'), val)}
                front={localSettings[`${activeTab}_show_stamp_front` as any]}
                back={localSettings[`${activeTab}_show_stamp_back` as any]}
                onFrontToggle={(v) => updateSetting(`${activeTab}_show_stamp_front` as any, v)}
                onBackToggle={(v) => updateSetting(`${activeTab}_show_stamp_back` as any, v)}
              />

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LayoutSwitch({ 
  label, 
  front, 
  back, 
  onFrontChange, 
  onBackChange 
}: { 
  label: string, 
  front: boolean, 
  back: boolean, 
  onFrontChange: (v: boolean) => void,
  onBackChange: (v: boolean) => void
}) {
  return (
    <div className="p-6 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm flex flex-col gap-4">
      <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{label}</span>
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Depan</span>
          <Switch checked={front} onCheckedChange={onFrontChange} className="data-[state=checked]:bg-primary" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Belakang</span>
          <Switch checked={back} onCheckedChange={onBackChange} className="data-[state=checked]:bg-primary" />
        </div>
      </div>
    </div>
  );
}

function AssetCard({ 
  label, 
  value, 
  onChange,
  front,
  back,
  onFrontToggle,
  onBackToggle
}: { 
  label: string, 
  value: string, 
  onChange: (v: string) => void,
  front: boolean,
  back: boolean,
  onFrontToggle: (v: boolean) => void,
  onBackToggle: (v: boolean) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-black uppercase text-slate-800 tracking-tight">{label}</Label>
      </div>
      
      <div className="aspect-[4/3] bg-white rounded-[1.5rem] border-2 border-dashed border-slate-100 flex items-center justify-center p-6 shadow-inner overflow-hidden group transition-all hover:border-primary/20 relative">
        {value ? (
          <img src={value} alt={label} className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105 duration-500" />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-20">
            <ImageIcon className="h-10 w-10" />
            <span className="text-[10px] font-black">BELUM ADA ASSET</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <LinkIcon className="h-3 w-3 text-slate-300 group-focus-within:text-primary" />
            <span className="text-[8px] font-black text-slate-300 group-focus-within:text-primary uppercase tracking-tighter">Link URL Foto/Logo</span>
          </div>
          <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder="" 
            className="pl-28 h-12 text-[10px] bg-slate-50 border-none rounded-xl font-medium focus-visible:ring-primary/10" 
          />
        </div>

        <div className="flex items-center gap-6 px-2">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase text-slate-400">Depan</span>
            <Switch checked={front} onCheckedChange={onFrontToggle} size="sm" className="scale-75 data-[state=checked]:bg-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase text-slate-400">Belakang</span>
            <Switch checked={back} onCheckedChange={onBackToggle} size="sm" className="scale-75 data-[state=checked]:bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
