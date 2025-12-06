import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/Layout/AppLayout";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "../components/ProtectedRoute";
import DashBoard from "../pages/DashBoard";
import SignupPage from "../pages/SignupPage";
import DocumentsPage from "../pages/DocumentPage";
import DocumentEditorPage from "../pages/DocumentEditorPage";
// import RedirectIfLoggedIn from "../components/RedirectIfLoggedIn";

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
        element: <LoginPage />,
      },

      {
        path: "register",
        element: <SignupPage />,
      },

      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        ),
      },

      {
        path: "workspace/:workspaceId/documents",
        element: (
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        ),
      },

      {
        path: "workspace/:workspaceId/document/:documentId",
        element: (
          <ProtectedRoute>
            <DocumentEditorPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
