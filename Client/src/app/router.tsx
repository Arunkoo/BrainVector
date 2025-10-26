import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/Layout/AppLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
  },
  {
    path: "/login",
  },
  {
    path: "*",
  },
]);

export default router;
