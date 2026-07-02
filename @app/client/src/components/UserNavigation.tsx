import { useCurrentUserProfileQuery } from "@app/graphql";
import { LogOut, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { UserAvatar } from "@/components/UserAvatar";
import { useLogOut } from "@/hooks/useLogOut";
import { useSession } from "@/providers/SessionContext";

export function UserNavigation() {
  const { t } = useTranslation(["common"]);
  const logout = useLogOut();
  const { session } = useSession();
  const { data } = useCurrentUserProfileQuery({
    fetchPolicy: "cache-and-network",
    skip: !session,
  });

  const profile = data?.currentUserProfile;
  if (!session) {
    return null;
  }

  const displayName =
    profile?.nickname.trim() || session.user.email || t("common:nav.account");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <UserAvatar className="h-8 w-8" name={displayName} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="truncate text-sm font-medium leading-none">
              {displayName}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/settings/profile">
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("common:nav.settings")}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("common:nav.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
