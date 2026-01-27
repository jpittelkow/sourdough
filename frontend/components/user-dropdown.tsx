"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          type="button"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
        >
          <Avatar className="h-8 w-8 border-2 border-background">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="text-xs font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium leading-tight">{user.name}</span>
              {user.is_admin && (
                <Badge variant="secondary" className="text-xs h-4 px-1.5 mt-0.5">
                  Admin
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/user/profile")}>
          <User className="mr-2 h-4 w-4" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/user/preferences")}>
          <Settings className="mr-2 h-4 w-4" />
          Preferences
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
