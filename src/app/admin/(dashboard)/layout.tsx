import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMobileHeader from '@/components/admin/AdminMobileHeader';
import { SidebarProvider } from '@/components/admin/AdminSidebarContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#0a0a0a]">
        <AdminMobileHeader />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 pt-20 lg:pt-8 min-h-screen w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
