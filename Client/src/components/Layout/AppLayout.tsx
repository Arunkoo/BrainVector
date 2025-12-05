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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-primary/20"></div>
        </div>
        <h2 className="text-xl font-semibold mt-6">Loading...</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Verifying your session
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
      </div>

      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-[2000px] mx-auto w-full">
        <Navbar />
        <div className="flex-1 flex gap-4 sm:gap-6 mt-4 sm:mt-6 min-h-0">
          <SideBar />
          <main className="flex-1 min-w-0 animate-fade-in">
            <div className="h-full rounded-xl lg:rounded-2xl bg-card border shadow-sm overflow-hidden">
              <div className="flex-1 h-full p-4 sm:p-6 lg:p-8 min-h-0 overflow-auto">
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
