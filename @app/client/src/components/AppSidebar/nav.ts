import { LayoutDashboard, Settings, UserRound } from "lucide-react";
import type { ComponentType } from "react";

export type RouteKey = "dashboard" | "profile" | "organization";
export type GroupKey = "workspace" | "settings";

export interface NavItem {
  key: RouteKey;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export interface NavGroup {
  key: GroupKey;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    key: "workspace",
    items: [
      {
        href: "/dashboard",
        icon: LayoutDashboard,
        key: "dashboard",
      },
    ],
  },
  {
    key: "settings",
    items: [
      {
        href: "/settings/profile",
        icon: UserRound,
        key: "profile",
      },
      {
        href: "/settings/organization",
        icon: Settings,
        key: "organization",
      },
    ],
  },
];
