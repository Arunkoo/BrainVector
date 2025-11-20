import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/Layout/AppLayout";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "Login",
        element: <LoginPage />,
      },
    ],
  },
]);

export default router;
