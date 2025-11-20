import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SideBar from "./SideBar";
import { useAuthStore } from "../../auth/auth.store"; // <-- Use only the core store
import { useEffect } from "react";

const AppLayout = () => {
  // Use ONE selector call to get only the needed state and action
  const { checkAuthStatus, isCheckingAuth } = useAuthStore((state) => ({
    checkAuthStatus: state.checkAuthStatus,
    isCheckingAuth: state.isCheckingAuth,
  }));

  // The rest of the logic remains the same
  useEffect(() => {
    // This action (checkAuthStatus) is stable and only runs once on mount.
    checkAuthStatus();
  }, [checkAuthStatus]);

  // If the component is still loading, show the spinner
  if (isCheckingAuth) {
    return (
      <div className="p-[50px], text-center">
        <h2>Loading...</h2>
        <p>Verifying your session status.</p>
      </div>
    );
  }

  // Once loading is complete (isCheckingAuth is false), render the layout
  return (
    <div className="flex gap-1 flex-col text-foreground lg:ml-36 md:ml-[60px] lg:mr-36 ml-5 md:mr-[60px] mr-5 mt-6 overflow-hidden">
      <Navbar />
      <div className="flex flex-1 w-full">
        <SideBar />
        <main className=" w-full md:w-[75%]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
