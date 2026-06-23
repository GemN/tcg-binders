import { Outlet } from "react-router";

import { Navbar } from "@/components/Navbar";

export const LayoutPage = () => {
  return (
    <div className="flex min-h-svh min-w-0 flex-col bg-background">
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
};
