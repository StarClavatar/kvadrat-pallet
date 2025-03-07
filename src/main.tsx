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
import TruckFilling from "./pages/TruckFilling/TruckFilling.tsx";
import NewTruckFilling from "./pages/NewTruckFilling/NewTruckFilling.tsx";
import ValueContext from "./context/valueContext.tsx";
import TestPage from "./pages/testPage.tsx";
import BoxAdmin from "./pages/BoxAdmin/BoxAdmin.tsx";
import ScanCell from "./pages/ScanCell/ScanCell.tsx";
import './pwa'

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
  {
    path: "/new-truck-filling",
    element: (
      <ProtectedRoute>
        <NewTruckFilling />
      </ProtectedRoute>
    ),
  },
  {
    path: "/truck-filling/:docId",
    element: (
      <ProtectedRoute>
        <TruckFilling />
      </ProtectedRoute>
    ),
  },
  {
    path: "/playground",
    element: (
      <ProtectedRoute>
        <TestPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/scan-cell",
    element: (
      <ProtectedRoute>
        <ScanCell />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cell/:cellCode",
    element: (
      <ProtectedRoute>
        <BoxAdmin />
      </ProtectedRoute>
    ),
  },
  {
    path: "/box-admin",
    element: (
      <ProtectedRoute>
        <BoxAdmin />
      </ProtectedRoute>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <PinAuthContext>
    <ValueContext>
    <RouterProvider router={router} />
    </ValueContext>
  </PinAuthContext>
  // </React.StrictMode>
);
