import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <h1>sidebar</h1>
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex 1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
