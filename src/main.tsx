// main.tsx
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import Workmode from "./pages/Workmode/Workmode.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import NewPallet from "./pages/NewPallet/NewPallet.tsx";
import Pallet from "./pages/Pallet/Pallet.tsx";
import PinAuthContext from "./context/PinAuthContext.tsx";
import ProtectedRoute from "./auth/ProtectedRoute/ProtectedRoute.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/workmode",
    element: (
      <ProtectedRoute>
        <Workmode />
      </ProtectedRoute>
    ),
  },
  {
    path: "/new-pallet",
    element: (
      <ProtectedRoute>
        <NewPallet />
      </ProtectedRoute>
    ),
  },
  {
    path: "/pallet/:sscc",
    element: (
      <ProtectedRoute>
        <Pallet />
      </ProtectedRoute>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
    <PinAuthContext>
      <RouterProvider router={router} />
    </PinAuthContext>
  // </React.StrictMode>
);
