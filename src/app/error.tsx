
"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center space-y-8 border-4 border-red-50">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertCircle className="h-10 w-10" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Opps! Terjadi Kendala</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Aplikasi mengalami kesalahan teknis yang tidak terduga. Kami telah mencatat masalah ini untuk segera diperbaiki.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl text-left overflow-auto max-h-32">
            <p className="text-[10px] font-mono text-slate-400 break-all">
              {error.message || 'Unknown technical error'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={() => reset()} className="w-full h-12 rounded-xl gap-2 font-black uppercase tracking-widest shadow-lg shadow-primary/20">
            <RefreshCcw className="h-4 w-4" /> Coba Lagi
          </Button>
          <Button variant="ghost" asChild className="w-full h-12 rounded-xl text-slate-400 hover:text-primary font-bold uppercase text-[10px] tracking-widest">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" /> Kembali ke Beranda
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
