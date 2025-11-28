import { useEffect, useState } from "react";
import { navLogo } from "../../assets/images";
import { Moon, Sun, Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

const Navbar = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  return (
    <nav className="w-full h-16 md:h-[72px] bg-card border border-border rounded-2xl shadow-sm flex items-center justify-between px-4 sm:px-5">
      <div className="flex items-center gap-2">
        <img
          src={navLogo.logo1}
          alt="BrainVector Logo"
          className="h-7 md:h-9 object-contain"
        />
        <h1 className="flex items-end gap-1 text-xl md:text-2xl font-semibold text-foreground">
          <span>Brain</span>
          <span className="italic font-normal">Vector</span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsDark((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background hover:bg-muted transition"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-300" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" />
          )}
        </button>

        <Bell className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground transition" />

        <Avatar className="ml-1 h-8 w-8 cursor-pointer">
          <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
};

export default Navbar;
