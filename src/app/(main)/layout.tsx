import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex flex-col flex-1 min-w-0 pb-20 lg:pb-0 animate-fade-in">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
