
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
  ImageIcon, 
  FileText, 
  Link as LinkIcon,
  Loader2
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
  const [activeAssetTab, setActiveAssetTab] = useState('student');

  // Update local state only when dbSettings arrives, otherwise use defaults
  useEffect(() => {
    if (dbSettings) {
      setLocalSettings(dbSettings);
    }
  }, [dbSettings]);

  const handleSave = async () => {
    if (!db) {
      toast({ variant: "destructive", title: "Database tidak siap", description: "Koneksi ke Firebase belum aktif." });
      return;
    }
    
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'school_settings', 'default'), localSettings);
      toast({ title: "Berhasil", description: "Pengaturan telah disimpan ke Cloud Firestore." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: "Terjadi kendala saat menghubungi database." });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (field: keyof SchoolSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Pengaturan Sekolah</h1>
          <p className="text-muted-foreground">Kelola identitas dan aset visual kartu secara manual.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-lg px-8 py-6 rounded-xl font-bold">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* KOLOM KIRI: IDENTITAS & ATURAN */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="bg-white pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Identitas & Legalitas</CardTitle>
              <CardDescription>Informasi teks utama yang akan tampil pada kartu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 bg-white">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nama Sekolah</Label>
                <Input 
                  value={localSettings.school_name} 
                  onChange={e => updateSetting('school_name', e.target.value)} 
                  className="h-12 rounded-xl bg-slate-50 border-slate-200" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Alamat</Label>
                <Textarea 
                  value={localSettings.address} 
                  onChange={e => updateSetting('address', e.target.value)} 
                  className="min-h-[100px] rounded-xl bg-slate-50 border-slate-200" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nama Kepala Sekolah</Label>
                  <Input 
                    value={localSettings.principal_name} 
                    onChange={e => updateSetting('principal_name', e.target.value)} 
                    className="h-12 rounded-xl bg-slate-50 border-slate-200" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">NIP</Label>
                  <Input 
                    value={localSettings.principal_nip} 
                    onChange={e => updateSetting('principal_nip', e.target.value)} 
                    className="h-12 rounded-xl bg-slate-50 border-slate-200" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="bg-white pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Aturan & Ketentuan Kartu</CardTitle>
              <CardDescription>Masukkan teks tata tertib untuk masing-masing kartu.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 bg-white">
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-50 border p-1 rounded-xl mb-6">
                  <TabsTrigger value="student" className="rounded-lg gap-2 text-xs font-bold">Pelajar</TabsTrigger>
                  <TabsTrigger value="exam" className="rounded-lg gap-2 text-xs font-bold">Ujian</TabsTrigger>
                  <TabsTrigger value="id" className="rounded-lg gap-2 text-xs font-bold">ID Card</TabsTrigger>
                </TabsList>
                <TabsContent value="student">
                  <Textarea 
                    value={localSettings.terms_student} 
                    onChange={e => updateSetting('terms_student', e.target.value)} 
                    className="min-h-[150px] rounded-xl bg-slate-50"
                  />
                </TabsContent>
                <TabsContent value="exam">
                  <Textarea 
                    value={localSettings.terms_exam} 
                    onChange={e => updateSetting('terms_exam', e.target.value)} 
                    className="min-h-[150px] rounded-xl bg-slate-50"
                  />
                </TabsContent>
                <TabsContent value="id">
                  <Textarea 
                    value={localSettings.terms_id} 
                    onChange={e => updateSetting('terms_id', e.target.value)} 
                    className="min-h-[150px] rounded-xl bg-slate-50"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: ASSET VISUAL */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-slate-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-slate-800">Aset Visual (URL)</CardTitle>
              <CardDescription>Masukkan link gambar untuk logo dan tanda tangan.</CardDescription>
            </CardHeader>
            <div className="px-1 border-b border-slate-200/50">
              <Tabs value={activeAssetTab} onValueChange={setActiveAssetTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 bg-transparent p-0">
                  <TabsTrigger value="student" className="text-[10px] font-bold uppercase">Pelajar</TabsTrigger>
                  <TabsTrigger value="exam" className="text-[10px] font-bold uppercase">Ujian</TabsTrigger>
                  <TabsTrigger value="id" className="text-[10px] font-bold uppercase">ID Card</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardContent className="p-6 space-y-8">
              <AssetInput 
                label="Logo Utama" 
                value={activeAssetTab === 'exam' ? localSettings.logo_left_exam : (activeAssetTab === 'id' ? localSettings.logo_left_id : localSettings.logo_left)}
                onChange={(val) => updateSetting(activeAssetTab === 'exam' ? 'logo_left_exam' : (activeAssetTab === 'id' ? 'logo_left_id' : 'logo_left'), val)}
              />
              <AssetInput 
                label="Tanda Tangan" 
                value={activeAssetTab === 'exam' ? localSettings.signature_exam : (activeAssetTab === 'id' ? localSettings.signature_id : localSettings.signature_image)}
                onChange={(val) => updateSetting(activeAssetTab === 'exam' ? 'signature_exam' : (activeAssetTab === 'id' ? 'signature_id' : 'signature_image'), val)}
              />
              <AssetInput 
                label="Stempel" 
                value={activeAssetTab === 'exam' ? localSettings.stamp_exam : (activeAssetTab === 'id' ? localSettings.stamp_id : localSettings.stamp_image)}
                onChange={(val) => updateSetting(activeAssetTab === 'exam' ? 'stamp_exam' : (activeAssetTab === 'id' ? 'stamp_id' : 'stamp_image'), val)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AssetInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{label}</Label>
      <div className="relative">
        <LinkIcon className="h-3 w-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder="https://..." 
          className="pl-8 h-10 text-[10px] bg-white border-slate-200 rounded-lg" 
        />
      </div>
      {value && (
        <div className="mt-2 bg-white rounded-lg border p-2 flex justify-center">
          <img src={value} alt="Preview" className="max-h-20 object-contain" />
        </div>
      )}
    </div>
  );
}
