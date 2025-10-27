import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SideBar from "./SideBar";

const AppLayout = () => {
  return (
    <div className="flex gap-1 flex-col min-h-screen text-foreground bg-background lg:ml-[120px] md:ml-[60px] ml-5 mt-1.5  lg:mr-[120px] md:mr-[60px] mr-5">
      <Navbar />
      <div className="flex flex-1 w-full">
        <SideBar />
        <main className="bg-amber-800 w-full md:w-[75%]">
          <Outlet />
          <h1>Hello</h1>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
