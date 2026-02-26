"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative w-48 h-48 mx-auto">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
          <div className="absolute inset-4 bg-white rounded-full shadow-xl flex items-center justify-center">
            <span className="text-8xl font-black text-primary italic opacity-20 select-none">404</span>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Halaman Tidak Ditemukan</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900 font-headline">Opps! Nyasar Ya?</h1>
          <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
            Sepertinya halaman yang Anda cari tidak tersedia atau sedang dalam pengembangan oleh tim IT EduCard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
          <Button variant="outline" className="gap-2 w-full sm:w-auto" asChild>
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </Button>
          <Button className="gap-2 w-full sm:w-auto shadow-lg shadow-primary/20" asChild>
            <Link href="/">
              <Home className="h-4 w-4" /> Menu Utama
            </Link>
          </Button>
        </div>

        <div className="pt-12 flex flex-col items-center gap-2 opacity-40">
           <div className="w-8 h-8 relative">
              <Image src="https://iili.io/KAqSZhb.png" alt="Logo" fill className="object-contain" />
           </div>
           <span className="text-[10px] font-bold uppercase tracking-[0.2em]">EduCard Sync Tana Toraja</span>
        </div>
      </div>
    </div>
  );
}
