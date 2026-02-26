"use client";

import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  FileText, 
  Settings, 
  Layout, 
  LogOut,
  ChevronsLeftRight,
  LayoutDashboard,
  Award,
  Contact,
  Database
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import Image from 'next/image';

const adminItems = [
  { title: 'Dashboard', icon: LayoutDashboard, url: '/admin' },
  { title: 'Data Siswa', icon: Users, url: '/admin/students' },
  { title: 'Kartu Pelajar', icon: CreditCard, url: '/admin/cards' },
  { title: 'Kartu Ujian', icon: Award, url: '/admin/exam-cards' },
  { title: 'ID Card Umum', icon: Contact, url: '/admin/id-cards' },
  { title: 'Absensi', icon: CalendarCheck, url: '/admin/attendance' },
  { title: 'Event Ujian', icon: FileText, url: '/admin/exams' },
  { title: 'Template Desain', icon: Layout, url: '/admin/templates' },
  { title: 'Log Database', icon: Database, url: '/admin/log-database' },
  { title: 'Settings', icon: Settings, url: '/admin/settings' },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    router.push('/'); // Diarahkan ke HomePage profesional
  };

  const handleSwitchMode = () => {
    router.push('/mode-selection');
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4 flex flex-row items-center gap-3">
        <div className="w-8 h-8 relative">
          <Image src="https://iili.io/KAqSZhb.png" alt="Logo" fill className="object-contain" priority unoptimized />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-primary leading-tight">EduCard Sync</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tana Toraja</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={pathname === item.url}
                    onClick={() => router.push(item.url)}
                    className="gap-3"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSwitchMode} className="gap-3 text-accent-foreground font-medium">
              <ChevronsLeftRight className="h-4 w-4" />
              <span>Ganti Role</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="gap-3 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
