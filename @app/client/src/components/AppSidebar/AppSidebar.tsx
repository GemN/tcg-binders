import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/Sidebar";
import { UserContextSwitcher } from "@/components/UserContextSwitcher";

import { navGroups, type NavGroup, type NavItem } from "./nav";

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserContextSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <AppSidebarGroup
            key={group.key}
            navGroup={group}
            currentPath={location.pathname}
          />
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

interface AppSidebarGroupProps {
  currentPath: string;
  navGroup: NavGroup;
}

const AppSidebarGroup: FC<AppSidebarGroupProps> = ({
  currentPath,
  navGroup,
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {t(`common:sidenav.group.${navGroup.key}`)}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navGroup.items.map((item) => (
            <AppSidebarItem
              key={item.key}
              navItem={item}
              currentPath={currentPath}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

interface SidebarItemProps {
  currentPath: string;
  navItem: NavItem;
}

const AppSidebarItem: FC<SidebarItemProps> = ({ navItem, currentPath }) => {
  const { t } = useTranslation(["common"]);
  const isActive = currentPath === navItem.href;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link to={navItem.href}>
          <navItem.icon className="h-4 w-4" />
          {t(`common:sidenav.${navItem.key}`)}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
