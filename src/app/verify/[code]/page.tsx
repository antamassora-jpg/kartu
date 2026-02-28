
"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Student, SchoolSettings } from '@/app/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XCircle, ShieldCheck, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';

export default function VerifyPage() {
  const params = useParams();
  const db = useFirestore();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'school_settings', 'default') : null, [db]);
  const { data: settings } = useDoc<SchoolSettings>(settingsRef);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!db || !params.code) return;
      
      const cleanCode = (params.code as string).replace('VERIFY-', '').trim();
      
      try {
        const qCode = query(collection(db, 'students'), where('card_code', '==', cleanCode));
        const qNis = query(collection(db, 'students'), where('nis', '==', cleanCode));
        
        const [snapCode, snapNis] = await Promise.all([getDocs(qCode), getDocs(qNis)]);
        const found = snapCode.docs[0] || snapNis.docs[0];
        
        if (found) {
          setStudent({ ...found.data() as Student, id: found.id });
        }
      } catch (err) {
        console.error("Verification error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudent();
  }, [db, params.code]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Memverifikasi Kartu...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#ECF0F8] p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 relative mb-3">
             <Image src="https://iili.io/KAqSZhb.png" alt="Logo" fill className="object-contain" />
          </div>
          <h1 className="text-xl font-bold text-primary text-center">Verifikasi Kartu Pelajar</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{settings?.school_name || 'SMKN 2 Tana Toraja'}</p>
        </div>

        {student ? (
          <Card className="shadow-2xl overflow-hidden border-none rounded-2xl">
            <div className={`h-2 ${student.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              <div className={`w-32 h-40 bg-muted rounded-xl relative overflow-hidden border-4 ${student.status === 'Aktif' ? 'border-green-100' : 'border-red-100'} shadow-inner mb-6`}>
                {student.photo_url ? (
                  <Image src={student.photo_url} alt={student.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-slate-200" />
                )}
              </div>

              <div className="text-center space-y-1 mb-6">
                 <h2 className="text-2xl font-bold text-primary leading-tight px-4 uppercase">{student.name}</h2>
                 <p className="text-sm text-muted-foreground font-medium">{student.class} - {student.major}</p>
                 <div className="pt-2">
                    <Badge variant={student.status === 'Aktif' ? 'default' : 'destructive'} className="px-4 py-1 text-sm rounded-full">
                       {student.status === 'Aktif' ? 'Kartu Valid & Aktif' : 'Kartu Nonaktif / Tidak Valid'}
                    </Badge>
                 </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t">
                 <div className="text-center border-r">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">NIS / NISN</p>
                    <p className="text-sm font-semibold">{student.nis}</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Berlaku Sampai</p>
                    <p className="text-sm font-semibold">{student.valid_until}</p>
                 </div>
              </div>
            </CardContent>
            <div className="bg-primary/5 py-4 px-6 flex items-center justify-center gap-2">
               <ShieldCheck className="h-4 w-4 text-primary" />
               <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Digital Authentication Secured</span>
            </div>
          </Card>
        ) : (
          <Card className="shadow-xl p-10 text-center space-y-4">
             <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-red-500">
                <XCircle className="h-10 w-10" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-destructive">Data Tidak Ditemukan</h2>
                <p className="text-sm text-muted-foreground mt-2">Kode kartu tidak valid atau kartu telah dihapus dari sistem Cloud.</p>
             </div>
          </Card>
        )}

        <p className="text-center mt-8 text-[10px] text-muted-foreground opacity-60">
           &copy; {new Date().getFullYear()} EduCard Sync. SMKN 2 Tana Toraja.
        </p>
      </div>
    </div>
  );
}
