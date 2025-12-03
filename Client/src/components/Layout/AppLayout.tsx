import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SideBar from "./SideBar";
import { useAuthStore } from "../../store/auth.store";
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
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <div className="mx-3 sm:mx-4 lg:mx-20 xl:mx-28 py-3 lg:py-5 flex-1 flex flex-col gap-3 sm:gap-4 max-w-none">
        <Navbar />
        <div className="flex gap-3 sm:gap-4 flex-1 items-stretch min-h-0">
          <SideBar />
          <main className="flex-1 min-w-0 min-h-0">
            <div className="h-full rounded-3xl bg-card border border-border shadow-sm flex flex-col">
              <div className="flex-1 px-3 sm:px-5 lg:px-8 py-4 sm:py-6 min-h-0 overflow-auto">
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
