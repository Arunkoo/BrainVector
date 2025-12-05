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
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-primary/20"></div>
        </div>
        <h2 className="text-xl font-bold mt-6 gradient-text">Loading...</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Verifying your session status.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow animation-delay-1s"></div>
      </div>

      <div className="mx-3 sm:mx-6 lg:mx-12 xl:mx-20 py-4 lg:py-6 flex-1 flex flex-col gap-4 sm:gap-5 max-w-none">
        <Navbar />
        <div className="flex gap-4 sm:gap-5 flex-1 items-stretch min-h-0">
          <SideBar />
          <main className="flex-1 min-w-0 min-h-0 animate-fade-in">
            <div className="h-full rounded-3xl bg-card/50 backdrop-blur-xl shadow-soft overflow-hidden">
              <div className="flex-1 h-full px-4 sm:px-6 lg:px-10 py-5 sm:py-7 min-h-0 overflow-auto">
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
