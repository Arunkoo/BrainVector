import { useEffect, useState } from "react";
import { navLogo } from "../../assets/images";
import { Moon, Sun, Bell, Search } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { useNavigate } from "react-router-dom";

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

  const [isScrolled, setIsScrolled] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const navigate = useNavigate();
  return (
    <div className="sticky top-4 z-50 w-full px-4">
      <nav
        className={`mx-auto mt-7 max-w-6xl transition-all duration-300 ${
          isScrolled
            ? "bg-card/90 backdrop-blur-xl border border-border shadow-lg"
            : "bg-card/80 backdrop-blur-lg border border-border"
        } rounded-2xl py-3 px-6`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="relative">
              <img
                src={navLogo.logo1}
                alt="BrainVector Logo"
                className="h-8 w-8"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">
                <span className="text-primary">Brain</span>
                <span className="text-muted-foreground italic ml-0.5">
                  Vector
                </span>
              </h1>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full pl-12 pr-4 py-2 text-sm bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button (Mobile) */}
            <button
              className="md:hidden p-2 hover:bg-muted/50 rounded-lg"
              title="search"
              aria-label="search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark((v) => !v)}
              className="p-2 hover:bg-muted/50 rounded-lg"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <button
              className="p-2 hover:bg-muted/50 rounded-lg relative"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full"></span>
            </button>

            {/* User Avatar */}
            <div className="ml-2">
              <Avatar className="h-9 w-9 border">
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  BV
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
