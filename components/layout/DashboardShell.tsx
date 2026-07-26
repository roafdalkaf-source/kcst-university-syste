'use client';
import { useState } from 'react';
import { Bell, Sun, Moon, Globe, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import type { UserWithRoles } from '@/types';

function Header({ unreadCount=0, onMenuClick }: { unreadCount?:number; onMenuClick:()=>void }) {
  const { i18n } = useTranslation();
  const [dark, setDark] = useState(false);
  const toggleLang = () => {
    const next = i18n.language==='ar'?'en':'ar';
    i18n.changeLanguage(next);
    document.documentElement.lang=next;
    document.documentElement.dir=next==='ar'?'rtl':'ltr';
    localStorage.setItem('kcst-lang',next);
  };
  return (
    <header className="h-14 border-b border-gray-100 bg-white/80 backdrop-blur-md flex items-center gap-3 px-4 sticky top-0 z-20">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
        <Menu className="w-5 h-5 text-gray-600"/>
      </button>
      <div className="flex-1"/>
      <button onClick={toggleLang} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
        <Globe className="w-3.5 h-3.5"/>
        {i18n.language==='ar'?'EN':'ع'}
      </button>
      <button onClick={()=>{setDark(d=>!d);document.documentElement.classList.toggle('dark');}}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
        {dark?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}
      </button>
      <Link href="/notifications" className="relative p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
        <Bell className="w-4 h-4"/>
        {unreadCount>0 && (
          <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount>9?'9+':unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
}

interface DashboardShellProps {
  user: UserWithRoles; children: React.ReactNode;
  pageTitle?: string; unreadCount?: number;
  branding?: { name_ar:string; name_en:string; logo_url?:string|null };
}

export function DashboardShell({ user, children, pageTitle, unreadCount=0, branding }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar user={user} unreadCount={unreadCount} branding={branding}/>
      </div>
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={()=>setMobileOpen(false)}/>
          <div className="fixed inset-y-0 start-0 z-50 lg:hidden">
            <Sidebar user={user} unreadCount={unreadCount} branding={branding}/>
          </div>
        </>
      )}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header unreadCount={unreadCount} onMenuClick={()=>setMobileOpen(o=>!o)}/>
        <main className="flex-1 overflow-y-auto bg-surface-raised">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
