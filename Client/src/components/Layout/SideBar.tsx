import type { FC, ComponentType, SVGProps } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Star, FileText, LogOut } from "lucide-react";
import {
  useAuthLoading,
  useAuthLogout,
  useAuthUser,
} from "../../auth/auth.store";
import { Link, useLocation, useNavigate } from "react-router-dom";

const sidebarLinks = [
  { icon: Star, label: "Starred", to: "/starred" },
  { icon: FileText, label: "Recent docs", to: "/recent" },
];

interface SidebarLinkProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  to: string;
  active: boolean;
}

const SidebarLink: FC<SidebarLinkProps> = ({
  icon: Icon,
  label,
  to,
  active,
}) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-3 py-2 text-[14px] rounded-xl transition-colors ${
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`}
  >
    <Icon className="h-4 w-4" />
    <span className="truncate">{label}</span>
  </Link>
);

const SideBar: FC = () => {
  const user = useAuthUser();
  const logout = useAuthLogout();
  const isLoading = useAuthLoading();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/Login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : "BV";

  const AuthenticatedFooter = (
    <>
      <div className="flex items-center gap-2 w-full px-2 py-2 rounded-lg">
        <Avatar className="h-9 w-9 ring-1 ring-border">
          <AvatarImage
            src="https://github.com/shadcn.png"
            alt={`${user?.name || user?.email} Avatar`}
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <p className="text-[14px] font-medium text-foreground truncate">
            {user?.name || user?.email}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {user?.role || "User"}
          </p>
        </div>
      </div>

      <Button
        onClick={handleLogout}
        disabled={isLoading}
        variant="ghost"
        className="
          w-full justify-start mt-1 h-9 rounded-full text-[13px]
          text-slate-700 hover:bg-red-50 hover:text-red-600
          dark:hover:bg-[#e5e7eb]
        "
      >
        <LogOut size={16} className="mr-2" />
        {isLoading ? "Logging out..." : "Log out"}
      </Button>
    </>
  );

  const PublicFooter = (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground text-center">
        Sign in to manage your workspaces.
      </p>
      <Link to="/Login">
        <Button className="w-full h-9 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 hover:shadow-md">
          Sign in / Sign up
        </Button>
      </Link>
    </div>
  );

  return (
    <aside className="hidden md:flex w-56 lg:w-64 shrink-0">
      <div className="w-full rounded-3xl bg-card border border-border shadow-sm flex flex-col py-4 min-h-[500px]">
        {user ? (
          <>
            <div className="px-4 pb-1 flex-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Navigation
              </p>
              <nav className="space-y-1.5">
                {sidebarLinks.map((link) => (
                  <SidebarLink
                    key={link.label}
                    icon={link.icon}
                    label={link.label}
                    to={link.to}
                    active={location.pathname === link.to}
                  />
                ))}
              </nav>
            </div>

            <div className="mt-auto px-3 pt-3 pb-3 border-t border-border shrink-0">
              {AuthenticatedFooter}
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
              <div className="w-20 h-20 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-md" />
              </div>
              <h2 className="text-sm font-semibold text-foreground mb-1">
                Welcome back
              </h2>
              <p className="text-xs text-muted-foreground">
                Access your workspaces and documents after signing in.
              </p>
            </div>
            <div className="px-3 pt-2 pb-3 border-t border-border shrink-0">
              {PublicFooter}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default SideBar;
