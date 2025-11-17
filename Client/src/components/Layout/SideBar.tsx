import { Button } from "../ui/button";
import { FileText } from "lucide-react";
import { Star } from "lucide-react";
import { Users } from "lucide-react";
const SideBar = () => {
  return (
    <div className="hidden md:block  w-[25%] min-h-dvh  bg-white/40  border-r">
      <div className="flex flex-col gap-2 justify-center items-center py-8">
        <Button className="font-semibold px-16 text-sm text-white bg-black hover:bg-black/90 hover:text-white/90 cursor-pointer">
          <span className="text-[19px] mr-2.5">+</span> New Document
        </Button>
      </div>
      <div className="flex flex-col gap-3.5 mt-2.5 max-w-full">
        <span className="inline-flex gap-1 justify-start items-center text-black/80 ml-[26px]">
          <FileText />
          <h1>All Documents</h1>
        </span>
        <span className="inline-flex gap-1 justify-start items-center text-black/80 ml-[26px]">
          <Star />
          <h1>Starred</h1>
        </span>
        <span className="inline-flex gap-1 justify-start items-center text-black/80 ml-[26px]">
          <Users />
          <h1>Owned by me</h1>
        </span>
      </div>
    </div>
  );
};

export default SideBar;
