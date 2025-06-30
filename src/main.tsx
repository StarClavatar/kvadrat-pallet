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
import BoxAdmin from "./pages/BoxAdmin/BoxAdmin.tsx";
import ScanCell from "./pages/ScanCell/ScanCell.tsx";
import './pwa'
import ScanOrder from "./pages/ScanOrder/ScanOrder.tsx";
import Order from "./pages/Order/Order.tsx";
import PalletDetails from "./pages/PalletDetails/PalletDetails.tsx";
import ScanPallet from "./pages/ScanPallet/ScanPallet.tsx";
import WorkPallet from "./pages/WorkPallet/WorkPallet.tsx";
import TestMode from "./pages/TestMode/TestMode.tsx";
import ViewPallet from "./pages/ViewPallet/ViewPallet";
import OrderGoods from "./pages/OrderGoods/OrderGoods";
import EntryPage from "./pages/EntryPage/EntryPage";
import Root from "./routes/root";
import Loader from "./components/Loader/Loader.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
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
      {
        path: "/scan-order",
        element: (
          <ProtectedRoute>
            <ScanOrder />
          </ProtectedRoute>
        ),
      },
      {
        path: "/order",
        element: (
          <ProtectedRoute>
            <Order />
          </ProtectedRoute>
        ),
      },
      {
        path: "/pallet-details/:palletId",
        element: (
          <ProtectedRoute>
            <PalletDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "/scan-pallet",
        element: (
          <ProtectedRoute>
            <ScanPallet />
          </ProtectedRoute>
        ),
      },
      {
        path: "/work-pallet/:palletId",
        element: <ProtectedRoute><WorkPallet /></ProtectedRoute>,
      },
      {
        path: "/test-mode",
        element: (
          <ProtectedRoute>
            <TestMode />
          </ProtectedRoute>
        ),
      },
      {
        path: "/view-pallet/:palletId",
        element: <ProtectedRoute><ViewPallet /></ProtectedRoute>,
      },
      {
        path: "/order-goods",
        element: <ProtectedRoute><OrderGoods /></ProtectedRoute>,
      },
      {
        path: "/truck-filling",
        element: <ProtectedRoute><TruckFilling /></ProtectedRoute>,
      },
      {
        path: "/test",
        element: <ProtectedRoute><TestMode /></ProtectedRoute>
      },
    ],
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
