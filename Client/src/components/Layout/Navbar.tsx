import { useEffect, useState } from "react";
import { navLogo } from "../../assets/images";
import { Moon, Sun, Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

const Navbar = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <nav className="w-full h-16 md:h-20 bg-card/50 backdrop-blur-xl rounded-2xl shadow-soft flex items-center justify-between px-5 sm:px-6 lg:px-8 animate-slide-up relative overflow-hidden group">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="flex items-center gap-3 relative z-10">
        <div className="relative">
          <img
            src={navLogo.logo1}
            alt="BrainVector Logo"
            className="h-8 md:h-10 object-contain drop-shadow-lg"
          />
        </div>
        <h1 className="flex items-end gap-1 text-xl md:text-2xl font-bold text-foreground">
          <span className="gradient-text">Brain</span>
          <span className="italic font-light text-muted-foreground">
            Vector
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 relative z-10">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => setIsDark((v) => !v)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 backdrop-blur-sm hover:bg-secondary transition-all duration-300 hover:scale-110 active:scale-95 group/theme shadow-sm"
          aria-label="Toggle dark mode"
        >
          <div className="absolute inset-0 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 opacity-0 group-hover/theme:opacity-100 transition-opacity duration-300"></div>
          {isDark ? (
            <Sun className="h-5 w-5 text-amber-400 relative z-10 transition-transform duration-300 group-hover/theme:rotate-12" />
          ) : (
            <Moon className="h-5 w-5 text-primary relative z-10 transition-transform duration-300 group-hover/theme:-rotate-12" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 backdrop-blur-sm hover:bg-secondary transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm group/bell"
          aria-label="Notifications"
        >
          <div className="absolute inset-0 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 opacity-0 group-hover/bell:opacity-100 transition-opacity duration-300"></div>
          <Bell className="h-5 w-5 text-muted-foreground group-hover/bell:text-foreground transition-all duration-300 relative z-10 group-hover/bell:animate-pulse" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full animate-pulse"></span>
        </button>

        {/* User Avatar */}
        <div className="relative group/avatar">
          <div className="absolute -inset-1 bg-linear-to-r from-primary to-accent rounded-full opacity-0 group-hover/avatar:opacity-75 blur transition-all duration-300"></div>
          <Avatar className="relative h-10 w-10 cursor-pointer ring-2 ring-background shadow-lg transition-all duration-300 group-hover/avatar:scale-110">
            <AvatarImage
              src="https://github.com/shadcn.png"
              alt="User Avatar"
            />
            <AvatarFallback className="bg-linear-to-br from-primary to-accent text-primary-foreground font-semibold">
              CN
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
