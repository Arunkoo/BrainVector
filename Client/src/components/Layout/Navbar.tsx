import { useEffect, useState } from "react";
import { navLogo } from "../../assets/images";
import { Moon, Sun, Bell, Search } from "lucide-react";
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
    <nav className="w-full h-14 sm:h-16 bg-card border rounded-lg sm:rounded-xl shadow-sm flex items-center justify-between px-4 sm:px-6 animate-slide-up">
      {/* Logo and Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={navLogo.logo1}
              alt="BrainVector Logo"
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
            />
          </div>
          <h1 className="hidden sm:flex items-end gap-1 text-xl font-bold">
            <span className="text-primary">Brain</span>
            <span className="font-medium text-muted-foreground">Vector</span>
          </h1>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md ml-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Button for Mobile */}
        <button
          className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => setIsDark((v) => !v)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors relative"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="p-2 hover:bg-secondary rounded-lg transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"></span>
        </button>

        {/* User Avatar */}
        <div className="ml-2">
          <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-border">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              BV
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
