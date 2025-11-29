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
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-background text-foreground">
        <h2 className="text-lg font-semibold">Loading...</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Verifying your session status.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-3 sm:mx-4 lg:mx-20 xl:mx-28 py-3 lg:py-5 flex flex-col gap-3 sm:gap-4">
        <Navbar />
        <div className="flex gap-3 sm:gap-4 items-stretch min-h-[500px]">
          <SideBar />
          <main className="flex-1 min-w-0">
            <div className="rounded-3xl bg-card border border-border shadow-sm min-h-[500px]">
              <div className="px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
