import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/Layout/AppLayout";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "../components/ProtectedRoute";
import DashBoard from "../pages/DashBoard";
import SignupPage from "../pages/SignupPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "Login",
        element: <LoginPage />,
      },
      { path: "Register", element: <SignupPage /> },
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
