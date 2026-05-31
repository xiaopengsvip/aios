import Sidebar, { DrawerProvider, UserProvider } from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
    <DrawerProvider>
      <div className="flex h-dvh overflow-hidden">
        {/* Desktop Sidebar (lg+) */}
        <Sidebar />

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile/Tablet TopBar (shown < lg) */}
          <TopBar />

          {/* Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav (shown < md) */}
        <BottomNav />
      </div>
    </DrawerProvider>
    </UserProvider>
  );
}
