
import React from 'react';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-hidden bg-gradient-to-br from-background to-white">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="container py-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
