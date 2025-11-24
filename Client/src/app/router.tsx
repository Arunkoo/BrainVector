import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/Layout/AppLayout";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "../components/ProtectedRoute";
import DashBoard from "../pages/DashBoard";
import SignupPage from "../pages/SignupPage";
import RedirectIfLoggedIn from "../components/RedirectIfLoggedIn";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />, // public
      },

      {
        path: "login",
        element: (
          <RedirectIfLoggedIn>
            <LoginPage />
          </RedirectIfLoggedIn>
        ),
      },

      {
        path: "register",
        element: (
          <RedirectIfLoggedIn>
            <SignupPage />
          </RedirectIfLoggedIn>
        ),
      },

      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
