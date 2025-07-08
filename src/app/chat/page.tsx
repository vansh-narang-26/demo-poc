'use client';

import React, { useEffect, Suspense } from 'react'; // <-- add Suspense
import { useRouter } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppHeader from "@/components/app-header";
import AppMain from "@/components/app-main";

function PageContent() {
  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-svh">
        <AppHeader />
        <div className="flex-1 min-h-0 overflow-hidden">
          <AppMain />
        </div>
      </SidebarInset>
    </>
  );
}

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.replace('/');
    }
  }, [router]);

  return (
    <SidebarProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <PageContent />
      </Suspense>
    </SidebarProvider>
  );
}
