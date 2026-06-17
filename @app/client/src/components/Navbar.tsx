import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SidebarTrigger } from "@/components/ui/Sidebar";
import { UserNavigation } from "@/components/UserNavigation";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:pr-6">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-end gap-2">
        <LanguageSwitcher />
      </div>
      <UserNavigation />
    </header>
  );
};
