
"use client";

import { useState, useEffect } from 'react';
import { SchoolSettings, Student, CardTemplate } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Upload, Camera, Loader2, Link as LinkIcon, RefreshCw, Database, ShieldAlert } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, setDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { DEFAULT_SETTINGS } from '@/app/lib/db';

export default function SettingsPage() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'school_settings', 'default') : null, [db]);
  const { data: dbSettings, isLoading } = useDoc<SchoolSettings>(settingsRef);
  
  const [localSettings, setLocalSettings] = useState<SchoolSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (dbSettings) {
      setLocalSettings(dbSettings);
    } else if (!isLoading && !dbSettings) {
      setLocalSettings(DEFAULT_SETTINGS);
    }
  }, [dbSettings, isLoading]);

  const handleSave = async () => {
    if (!localSettings || !db) return;
    
    setIsSaving(true);
    setDoc(doc(db, 'school_settings', 'default'), localSettings)
      .then(() => {
        toast({ title: "Konfigurasi Disimpan", description: "Pengaturan institusi telah diperbarui di Firestore." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'school_settings/default',
          operation: 'update',
          requestResourceData: localSettings
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleSeedData = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      // 1. Seed Settings
      await setDoc(doc(db, 'school_settings', 'default'), DEFAULT_SETTINGS);
      
      // 2. Seed Default Templates if empty
      const tempSnap = await getDocs(collection(db, 'templates'));
      if (tempSnap.empty) {
        const defaultTemplates = [
          { type: 'STUDENT_CARD', name: 'Standard Blue', is_active: true, config_json: '{}', preview_color: 'bg-blue-600' },
          { type: 'EXAM_CARD', name: 'Standard Orange', is_active: true, config_json: '{}', preview_color: 'bg-orange-500' },
          { type: 'ID_CARD', name: 'Corporate Green', is_active: true, config_json: '{}', preview_color: 'bg-emerald-800' }
        ];
        for (const t of defaultTemplates) {
          await addDoc(collection(db, 'templates'), t);
        }
      }

      toast({ title: "Database Diinisialisasi", description: "Data awal berhasil dipasang ke Cloud Firestore." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal Inisialisasi", description: "Terjadi kesalahan saat menulis data awal." });
    } finally {
      setIsSeeding(false);
    }
  };

  const updateSetting = (field: keyof SchoolSettings, value: any) => {
    setLocalSettings(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  if (isLoading || !localSettings) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
       <Loader2 className="h-10 w-10 animate-spin text-primary" />
       <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Menghubungkan ke Cloud Settings...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary uppercase">Settings Center</h1>
          <p className="text-muted-foreground">Kelola identitas institusi dan sinkronisasi Cloud Firestore.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedData} disabled={isSeeding} className="gap-2 border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100">
            {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Inisialisasi Cloud Data
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-lg shadow-primary/20 min-w-[180px]">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            SIMPAN PERUBAHAN
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-100">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg">Identitas & Legalitas</CardTitle>
            <CardDescription>Informasi resmi sekolah untuk dicetak pada kartu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Nama Sekolah</Label>
              <Input value={localSettings.school_name} onChange={e => updateSetting('school_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Alamat</Label>
              <Textarea value={localSettings.address} onChange={e => updateSetting('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Kepala Sekolah</Label>
                <Input value={localSettings.principal_name} onChange={e => updateSetting('principal_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">NIP</Label>
                <Input value={localSettings.principal_nip} onChange={e => updateSetting('principal_nip', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-100 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-800">
              <ShieldAlert className="h-5 w-5" /> Maintenance Database
            </CardTitle>
            <CardDescription>Pengaturan tingkat lanjut untuk pemulihan data cloud.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-red-600 font-medium">Gunakan fitur <strong>Inisialisasi Cloud Data</strong> jika database Firebase baru saja dibersihkan atau aplikasi baru pertama kali dihubungkan ke backend baru.</p>
            <div className="p-4 bg-white rounded-xl border border-red-100 text-[10px] space-y-2">
               <div className="flex justify-between"><span>Status Firestore:</span> <span className="font-bold text-emerald-600">CONNECTED</span></div>
               <div className="flex justify-between"><span>Dokumen Settings:</span> <span className="font-bold">{dbSettings ? 'DITEMUKAN' : 'KOSONG'}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
