import { useApolloClient } from "@apollo/client";
import { useCurrentUserOrganizationContextsQuery } from "@app/graphql";
import { Building2, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { SidebarMenuButton } from "@/components/ui/Sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  type UserContext,
  useUserContext,
} from "@/providers/UserContextContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";

export const UserContextSwitcher = () => {
  const client = useApolloClient();
  const isMobile = useIsMobile();
  const { t } = useTranslation(["common"]);
  const { currentContext, setContext, clearContext } = useUserContext();
  const { data, loading } = useCurrentUserOrganizationContextsQuery({
    fetchPolicy: "cache-and-network",
  });
  const roleLabels: Record<string, string> = {
    OWNER: t("common:sidenav.contexts.role.OWNER"),
    ADMIN: t("common:sidenav.contexts.role.ADMIN"),
    MEMBER: t("common:sidenav.contexts.role.MEMBER"),
  };

  const contexts = useMemo<UserContext[]>(() => {
    const edges = data?.currentUserOrganizationContexts?.edges || [];
    return edges.map(({ node }) => ({
      organizationId: node.organizationId,
      organizationName: node.organization?.name || "",
      role: node.role,
    }));
  }, [data]);

  const handleClickContext = (context: UserContext) => () => {
    if (currentContext?.organizationId === context.organizationId) {
      return;
    }
    setContext(context, true);
    client.resetStore();
  };

  useEffect(() => {
    if (
      !loading &&
      currentContext &&
      !contexts.some(
        (context) => context.organizationId === currentContext.organizationId
      )
    ) {
      clearContext();
    }
  }, [loading, contexts, currentContext, clearContext]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          {currentContext ? (
            <>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                <span className="truncate font-medium">
                  {currentContext.organizationName}
                </span>
                <span className="truncate text-xs">
                  {roleLabels[currentContext.role] || currentContext.role}
                </span>
              </div>
            </>
          ) : (
            <div className="truncate">
              {t("common:sidenav.contexts.select_value")}
            </div>
          )}
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width)"
        align="start"
        side={isMobile ? "bottom" : "right"}
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {t("common:sidenav.contexts.organizations")}
          </DropdownMenuLabel>
          {contexts.map((context) => (
            <DropdownMenuItem
              key={context.organizationId}
              className="cursor-pointer"
              onSelect={handleClickContext(context)}
            >
              {context.organizationName}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
