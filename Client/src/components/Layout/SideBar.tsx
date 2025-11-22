import type { FC, ComponentType, SVGProps } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

import { FileText, Star, Users, LogOut } from "lucide-react";
import {
  useAuthLoading,
  useAuthLogout,
  useAuthUser,
} from "../../auth/auth.store";
import { Link, useNavigate } from "react-router-dom";

const sidebarLinks = [
  { icon: FileText, label: "All Workspaces" },
  { icon: Star, label: "Starred" },
  { icon: Users, label: "Owned by me" },
];

interface SidebarLinkProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
}

const SidebarLink: FC<SidebarLinkProps> = ({ icon: Icon, label }) => (
  <span className="flex items-center gap-2 px-7 py-2 text-[15px] text-black/80 cursor-pointer hover:bg-black/5 rounded-md transition">
    <Icon className="h-4 w-4" />
    <h1>{label}</h1>
  </span>
);

const SideBar = () => {
  const user = useAuthUser();
  const logout = useAuthLogout();
  const isLoading = useAuthLoading();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/Login");
  };

  const initials = user?.name
    ? user.name
        .split("")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : "BV";

  const AuthenticatedFooter = (
    <>
      <div className="flex items-center gap-3 w-full px-2 py-2 hover:bg-black/5 rounded-lg cursor-pointer transition">
        <Avatar className="h-10 w-10 ring-1 ring-black/10">
          <AvatarImage
            src="https://github.com/shadcn.png"
            alt={`${user?.name || user?.email} Avatar`}
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col overflow-hidden">
          <h1 className="text-[15px] font-medium text-black truncate">
            {user?.name || user?.email}
          </h1>
          <p className="text-xs text-black/60 truncate">
            Role: {user?.role || "User"}
          </p>
        </div>
      </div>

      <Button
        onClick={handleLogout}
        disabled={isLoading}
        variant="ghost"
        className="w-full justify-start mt-3 text-black/80 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut size={18} className="mr-2" />
        {isLoading ? "Logging Out..." : "Log Out"}
      </Button>
    </>
  );

  const PublicFooter = (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-black/70 text-center">
        Get Started
      </h3>

      <Link to="/Login">
        <Button className="w-full bg-black text-white cursor-pointer hover:bg-black/95 hover:text-white/95">
          Sign In/Sign Up
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="hidden md:flex w-[25%] min-h-dvh bg-white/40 border-r flex-col">
      {user ? (
        <>
          {/* Auth - Create Workspace */}
          <div className="flex justify-center items-center py-10 mt-8">
            <Button className="font-semibold px-16 text-sm text-white bg-black hover:bg-black/90 cursor-pointer">
              <span className="text-[19px] mr-2.5">+</span> Create Workspace
            </Button>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-1 mt-2 px-2">
            {sidebarLinks.map((link) => (
              <SidebarLink
                key={link.label}
                icon={link.icon}
                label={link.label}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t mt-[200px]">{AuthenticatedFooter}</div>
        </>
      ) : (
        <>
          {/* NEW: Logged-out placeholder (prevents empty sidebar) */}
          <div className="flex flex-col items-center text-center px-6 pt-14 pb-6 ">
            {/* Placeholder UI box */}
            <div className="w-28 h-28 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center mb-5">
              <div className="w-12 h-12 bg-black/10 rounded-md" />
            </div>

            <h2 className="text-lg font-semibold text-black/80 mb-1">
              Welcome to BrainVector
            </h2>

            <p className="text-sm text-black/60 max-w-[80%]">
              Sign in to create and manage your workspaces.
            </p>
          </div>

          {/* Public Footer */}
          <div className="p-4 border-t mt-[200px]">{PublicFooter}</div>
        </>
      )}
    </div>
  );
};

export default SideBar;
