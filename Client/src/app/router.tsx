import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/Layout/AppLayout";
import LoginPage from "../pages/LoginPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />, // AppLayout is the parent wrapper
    children: [
      // {
      //   // index: true, // This makes it the default content for the root path ("/")
      //   // element: <HomePage />,
      // },
      // 2. Login Page (Public)
      {
        path: "login",
        element: <LoginPage />,
      },
      // 3. Dashboard (Protected)
      {
        path: "dashboard",
        // Wrap the protected content with the <ProtectedRoute> component
        // element: (
        //   <ProtectedRoute>
        //     <DashboardPage />
        //   </ProtectedRoute>
        // ),
      },
      // 4. Catch-all path for 404
      {
        path: "*",
        element: <div>404 Not Found</div>,
      },
    ],
  },
]);

export default router;
