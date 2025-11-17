import { navLogo } from "../../assets/images";
import { Moon, Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

const Navbar = () => {
  return (
    <nav className="w-full h-16 md:h-[77px] bg-white/40 border-b flex items-center justify-between px-4 py-2 rounded-2xl">
      {/* Logo Section */}
      <div className="flex items-center gap-2">
        <img
          src={navLogo.logo1}
          alt="BrainVector Logo"
          className="h-7 md:h-9 object-contain"
        />
        <h1 className="flex items-end gap-1 text-xl md:text-2xl font-semibold">
          <span>Brain</span>
          <span className="italic font-normal">Vector</span>
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Responsive Icon Sizes */}
        <Moon
          size={20}
          className="md:size-5 cursor-pointer transition hover:opacity-70"
        />
        <Bell
          size={20}
          className="md:size-5 cursor-pointer transition hover:opacity-70"
        />

        {/* Avatar */}
        <Avatar className="ml-2 cursor-pointer">
          <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
};

export default Navbar;
