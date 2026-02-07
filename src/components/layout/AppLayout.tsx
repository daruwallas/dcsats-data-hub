import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { IdleDetector } from "@/components/IdleDetector";
import { TodoGuardProvider } from "@/components/TodoGuard";

export function AppLayout() {
  return (
    <TodoGuardProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
        <IdleDetector />
      </SidebarProvider>
    </TodoGuardProvider>
  );
}
