import { Settings, UserRound } from "lucide-react";
import type { ComponentType } from "react";

export type RouteKey = "profile" | "organization";
export type GroupKey = "settings";

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
