import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SideBar from "./SideBar";
import { useAuthStore } from "../../auth/auth.store";
import { useEffect } from "react";

const AppLayout = () => {
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="p-[50px] text-center">
        <h2>Loading...</h2>
        <p>Verifying your session status.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen text-foreground lg:ml-36 md:ml-[60px] lg:mr-36 ml-5 md:mr-[60px] mr-5 mt-6">
      <Navbar />

      <div className="flex flex-1 w-full">
        <SideBar />
        <main className="w-full md:w-[75%]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
