import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import SideBar from "./SideBar";
import { useAuthStore } from "../../store/auth.store";
import { useEffect } from "react";

const AppLayout = () => {
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const location = useLocation();

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only show sidebar on app pages
  const showSidebar = !["/", "/login", "/register"].includes(location.pathname);

  if (isCheckingAuth && showSidebar) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground pt-16">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-primary/20"></div>
        </div>
        <h2 className="text-xl font-semibold mt-6">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
      </div>

      {/* Sticky Navbar with top spacing */}
      <div className="sticky top-0 z-50 w-full bg-background/80  supports-backdrop-filter:bg-background/60  border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Navbar />
        </div>
      </div>

      {/* Main content with proper spacing */}
      <div
        className={`${
          showSidebar ? "flex" : ""
        } container mx-auto px-4 sm:px-6 lg:px-8 py-6 ${
          showSidebar ? "gap-6" : ""
        }`}
      >
        {/* Sidebar - Conditionally shown */}
        {showSidebar && (
          <div className="hidden md:flex w-56 lg:w-64 shrink-0">
            <SideBar />
          </div>
        )}

        {/* Main content */}
        <main className={`${showSidebar ? "flex-1" : "w-full"}`}>
          <div
            className={`${
              showSidebar
                ? "rounded-xl lg:rounded-2xl bg-card border shadow-sm"
                : ""
            }`}
          >
            <div className={`${showSidebar ? "p-6" : ""}`}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
