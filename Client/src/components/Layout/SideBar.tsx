import type { FC, ComponentType, SVGProps } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Home, Star, FileText, Folder, Settings, LogOut } from "lucide-react";
import {
  useAuthLoading,
  useAuthLogout,
  useAuthUser,
} from "../../store/auth.store";
import { Link, useLocation, useNavigate } from "react-router-dom";

const sidebarLinks = [
  { icon: Home, label: "Dashboard", to: "/dashboard" },
  { icon: Folder, label: "Workspaces", to: "/dashboard" },
  { icon: Star, label: "Starred", to: "/starred" },
  { icon: FileText, label: "Recent", to: "/recent" },
  { icon: Settings, label: "Settings", to: "/settings" },
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
    className={`
      flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all
      ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }
    `}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
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
      <div className="flex items-center gap-3 w-full px-3 py-3 rounded-lg bg-muted/50">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src="https://github.com/shadcn.png"
            alt={`${user?.name || user?.email} Avatar`}
          />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {user?.name || user?.email}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.role || "User"}
          </p>
        </div>
      </div>

      <Button
        onClick={handleLogout}
        disabled={isLoading}
        variant="ghost"
        className="w-full justify-start mt-2 h-9 rounded-lg text-sm"
      >
        <LogOut size={16} className="mr-2" />
        {isLoading ? "Logging out..." : "Log out"}
      </Button>
    </>
  );

  const PublicFooter = (
    <div className="space-y-3 animate-fade-in">
      <p className="text-xs text-muted-foreground text-center px-2">
        Sign in to access all features
      </p>
      <Link to="/Login">
        <Button className="w-full h-9 rounded-lg text-sm font-medium ">
          Sign in
        </Button>
      </Link>
    </div>
  );

  return (
    <aside className="hidden md:flex w-56 lg:w-64 shrink-0 animate-slide-up [animation-delay:0.1s]">
      <div className="w-full h-full rounded-xl lg:rounded-2xl bg-card border shadow-sm flex flex-col py-4 sm:py-5">
        {/* Navigation */}
        <div className="px-3 sm:px-4 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Navigation
          </p>
          <nav className="space-y-1">
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

        {/* Footer */}
        <div className="mt-auto px-3 sm:px-4 pt-4 border-t">
          {user ? AuthenticatedFooter : PublicFooter}
        </div>
      </div>
    </aside>
  );
};

export default SideBar;
