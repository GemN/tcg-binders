import { type FC, useMemo } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/Avatar.tsx";

const avatarColors = {
  bleuRoyal: "#3B82F6",
  rougeRubis: "#EF4444",
  vertEmeraude: "#10B981",
  violet: "#8B5CF6",
  ambre: "#F59E0B",
  rose: "#EC4899",
  cyan: "#06B6D4",
  indigo: "#6366F1",
};

interface UserAvatarProps {
  className?: string;
  firstname?: string | null;
  lastname?: string | null;
  imageUrl?: string;
}

export const UserAvatar: FC<UserAvatarProps> = ({
  imageUrl,
  firstname,
  lastname,
  className,
}) => {
  const fullName = `${firstname} ${lastname}`;
  const fallbackText = `${firstname?.[0] || ""}${lastname?.[0] || ""}`;
  const avatarColor = useMemo(() => {
    const colors = Object.values(avatarColors);
    const hash = fallbackText
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, [fallbackText]);

  const style = {
    backgroundColor: avatarColor,
  };
  return (
    <Avatar className={className}>
      <AvatarImage src={imageUrl} alt={fullName} className="object-cover" />
      <AvatarFallback style={style} className="text-white">
        <span className="no-underline">{fallbackText}</span>
      </AvatarFallback>
    </Avatar>
  );
};
