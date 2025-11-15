import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SideBar from "./SideBar";

const AppLayout = () => {
  return (
    <div className="flex gap-1 flex-col min-h-screen text-foreground bg-accent lg:ml-40 md:ml-[60px] lg:mr-40 ml-5 md:mr-[60px] mr-5 mt-6">
      <Navbar />
      <div className="flex flex-1 w-full">
        <SideBar />
        <main className=" w-full md:w-[75%]">
          <Outlet />
          <h1>Hello</h1>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
