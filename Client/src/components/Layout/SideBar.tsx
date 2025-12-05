import type { FC, ComponentType, SVGProps } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Star, FileText, LogOut } from "lucide-react";
import {
  useAuthLoading,
  useAuthLogout,
  useAuthUser,
} from "../../store/auth.store";
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
    className={`
      relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group overflow-hidden
      ${
        active
          ? "bg-linear-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      }
    `}
  >
    {active && (
      <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-accent/20 animate-pulse"></div>
    )}
    <Icon
      className={`h-4 w-4 relative z-10 transition-transform duration-300 ${
        active ? "scale-110" : "group-hover:scale-110"
      }`}
    />
    <span className="truncate relative z-10">{label}</span>
    {active && (
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-l-full"></div>
    )}
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
      <div className="flex items-center gap-3 w-full px-3 py-3 rounded-xl bg-secondary/30 backdrop-blur-sm group hover:bg-secondary/50 transition-all duration-300">
        <div className="relative">
          <div className="absolute -inset-1 bg-linear-to-r from-primary to-accent rounded-full opacity-0 group-hover:opacity-75 blur transition-all duration-300"></div>
          <Avatar className="relative h-10 w-10 ring-2 ring-background shadow-md">
            <AvatarImage
              src="https://github.com/shadcn.png"
              alt={`${user?.name || user?.email} Avatar`}
            />
            <AvatarFallback className="bg-linear-to-br from-primary to-accent text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
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
        className="
          w-full justify-start mt-2 h-11 rounded-xl text-sm font-medium
          text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/10
          transition-all duration-300 group
        "
      >
        <LogOut
          size={16}
          className="mr-2 transition-transform duration-300 group-hover:scale-110"
        />
        {isLoading ? "Logging out..." : "Log out"}
      </Button>
    </>
  );

  const PublicFooter = (
    <div className="flex flex-col gap-3 animate-fade-in">
      <p className="text-xs text-muted-foreground text-center">
        Sign in to manage your workspaces.
      </p>
      <Link to="/Login">
        <Button className="w-full h-11 rounded-xl text-sm font-semibold shadow-lg">
          Sign in / Sign up
        </Button>
      </Link>
    </div>
  );

  return (
    <aside className="hidden md:flex w-64 lg:w-72 shrink-0 animate-slide-up [animation-delay:0.1s]">
      <div className="w-full h-full rounded-3xl bg-card/50 backdrop-blur-xl shadow-soft flex flex-col py-5 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-primary/5 to-transparent"></div>

        {user ? (
          <>
            <div className="px-5 pb-2 flex-1 relative z-10">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                Navigation
              </p>
              <nav className="space-y-2">
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

            <div className="mt-auto px-4 pt-4 shrink-0 relative z-10">
              {AuthenticatedFooter}
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 flex flex-col items-center justify-center px-5 text-center relative z-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl"></div>
                <div className="relative w-24 h-24 rounded-2xl bg-linear-to-br from-primary/10 to-accent/10 backdrop-blur-sm flex items-center justify-center shadow-xl">
                  <div className="w-12 h-12 bg-linear-to-br from-primary to-accent rounded-xl opacity-50"></div>
                </div>
              </div>
              <h2 className="text-base font-bold text-foreground mb-2 gradient-text">
                Welcome back
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Access your workspaces and documents after signing in.
              </p>
            </div>
            <div className="px-4 pt-3 pb-4 shrink-0 relative z-10">
              {PublicFooter}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default SideBar;
