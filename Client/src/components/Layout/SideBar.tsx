import type { FC, ComponentType, SVGProps } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

import { FileText, Star, Users, LogOut } from "lucide-react";

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
  <span className="inline-flex gap-1 justify-start items-center text-[15px] font-normal text-black/80 ml-[26px] cursor-pointer hover:text-black/90 transition-colors">
    <Icon />
    <h1>{label}</h1>
  </span>
);

const SideBar = () => {
  return (
    <div className="hidden md:block w-[25%] min-h-dvh bg-white/40 border-r  flex-col">
      <div className="flex flex-col gap-2 justify-center items-center py-8">
        <Button className="font-semibold px-16 text-sm text-white bg-black hover:bg-black/90 hover:text-white/90 cursor-pointer">
          <span className="text-[19px] mr-2.5">+</span> Create Workspace
        </Button>
      </div>

      <div className="flex flex-col gap-3.5 mt-2.5 max-w-full grow">
        {sidebarLinks.map((link) => (
          <SidebarLink key={link.label} icon={link.icon} label={link.label} />
        ))}
      </div>

      <div className="p-4 border-t mt-[75%]">
        <div className="inline-flex gap-2 items-center w-full p-2 hover:bg-white/50 rounded-md cursor-pointer transition-colors">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src="https://github.com/shadcn.png"
              alt="User Avatar"
            />
            <AvatarFallback>AR</AvatarFallback>
          </Avatar>

          <div className="flex flex-col justify-start leading-tight">
            <h1 className="text-[15px] font-medium text-black">Arun</h1>
            <p className="text-xs text-black/60">Role: Admin</p>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start mt-2 text-black/80 hover:bg-white/50 hover:text-red-600"
        >
          <LogOut size={20} className="mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default SideBar;
