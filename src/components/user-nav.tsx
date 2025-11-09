import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type User = {
    name: string;
    email: string;
    avatar: string;
    role: "faculty" | "admin" | "oa";
}

type UserNavProps = {
  user: User;
  logout: () => void;
};

export function UserNav({ user, logout }: UserNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid') || '';

  const getSettingsHref = () => {
    switch(user.role) {
        case 'admin':
            return `/u/portal/dashboard/admin/settings?uid=${uid}`;
        case 'faculty':
            return `/u/portal/dashboard/settings?uid=${uid}`;
        default:
            return '#'; // No settings page for OA for now
    }
  }

  const settingsHref = getSettingsHref();

  const handleLogout = () => {
    logout();
    const loginUrl = user.role === 'admin' ? '/u/portal/auth?admin' : '/u/portal/auth?faculty_login';
    router.push(loginUrl);
  };
    
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
           {user.role !== 'oa' && (
            <>
            <Link href={settingsHref}>
                <DropdownMenuItem>
                    Profile
                </DropdownMenuItem>
            </Link>
            <Link href={settingsHref}>
                <DropdownMenuItem>
                    Settings
                </DropdownMenuItem>
            </Link>
            </>
           )}
           <DropdownMenuItem>
                Help & Feedback
            </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
            Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
