import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SideBar from "./SideBar";

const AppLayout = () => {
  return (
    <div className="flex gap-1 flex-col  text-foreground  lg:ml-36 md:ml-[60px] lg:mr-36 ml-5 md:mr-[60px] mr-5 mt-6 overflow-hidden">
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
