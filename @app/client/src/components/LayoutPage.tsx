import { Outlet } from "react-router";

import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { Navbar } from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/Sidebar";

export const LayoutPage = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen min-w-0 flex-1 flex-row">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          <main className="flex flex-1 flex-col">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
