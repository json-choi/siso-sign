import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMobileHeader from '@/components/admin/AdminMobileHeader';
import { SidebarProvider } from '@/components/admin/AdminSidebarContext';
import { FeedbackProvider } from '@/components/admin/AdminFeedback';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <FeedbackProvider>
        <div className="min-h-dvh bg-[#0a0a0a] text-gray-200 lg:flex">
          <AdminSidebar />
          <div className="min-w-0 flex-1">
            <AdminMobileHeader />
            <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 lg:px-8 lg:py-10">
              {children}
            </main>
          </div>
        </div>
      </FeedbackProvider>
    </SidebarProvider>
  );
}
