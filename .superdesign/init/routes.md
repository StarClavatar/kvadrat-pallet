# Route map

Routing is config-based with React Router 6.22.3 and `createBrowserRouter`. Every page is nested under `Root`; all routes except `/` are wrapped by `ProtectedRoute`.

| URL | Component | Layout / guard | Summary |
|---|---|---|---|
| `/` | `src/App.tsx` → `src/pages/EntryPage/EntryPage.tsx` | `Root` | PIN login/keypad and PWA update prompt |
| `/workmode` | `src/pages/Workmode/Workmode.tsx` | `Root`, protected | Operation menu / main hub |
| `/new-pallet` | `src/pages/NewPallet/NewPallet.tsx` | `Root`, protected | Start pallet creation |
| `/pallet/:sscc` | `src/pages/Pallet/Pallet.tsx` | `Root`, protected | Pallet workflow |
| `/new-truck-filling` | `src/pages/NewTruckFilling/NewTruckFilling.tsx` | `Root`, protected | Start truck loading |
| `/truck-filling/:docId` | `src/pages/TruckFilling/TruckFilling.tsx` | `Root`, protected | Truck loading document |
| `/scan-cell` | `src/pages/ScanCell/ScanCell.tsx` | `Root`, protected | Scan inventory cell |
| `/cell/:cellCode` | `src/pages/BoxAdmin/BoxAdmin.tsx` | `Root`, protected | Cell inventory |
| `/box-admin` | `src/pages/BoxAdmin/BoxAdmin.tsx` | `Root`, protected | Box administration |
| `/scan-order` | `src/pages/ScanOrder/ScanOrder.tsx` | `Root`, protected | Scan order |
| `/order` | `src/pages/Order/Order.tsx` | `Root`, protected | Order workflow |
| `/pallet-details/:palletId` | `src/pages/PalletDetails/PalletDetails.tsx` | `Root`, protected | Pallet details |
| `/scan-pallet` | `src/pages/ScanPallet/ScanPallet.tsx` | `Root`, protected | Scan pallet |
| `/work-pallet/:palletId` | `src/pages/WorkPallet/WorkPallet.tsx` | `Root`, protected | Work with pallet |
| `/test-mode`, `/test` | `src/pages/TestMode/TestMode.tsx` | `Root`, protected | Test page aliases |
| `/view-pallet/:palletId` | `src/pages/ViewPallet/ViewPallet.tsx` | `Root`, protected | Read-only pallet view |
| `/order-goods` | `src/pages/OrderGoods/OrderGoods.tsx` | `Root`, protected | Order goods |
| `/truck-filling` | `src/pages/TruckFilling/TruckFilling.tsx` | `Root`, protected | Truck loading without URL document id |
| `/disaggregation` | `src/pages/Disaggregation/Disaggregation.tsx` | `Root`, protected | Disaggregation |
| `/box-aggregation` | `src/pages/BoxAggregation/BoxAggregation.tsx` | `Root`, protected | Box aggregation |
| `/scan-box` | `src/pages/ScanBox/ScanBox.tsx` | `Root`, protected | Scan box |
| `/create-box` | `src/pages/CreateBox/CreateBox.tsx` | `Root`, protected | Create/aggregate box |
| `/set-aggregation` | `src/pages/KitAggregation/KitAggregation.tsx` | `Root`, protected | Kit aggregation |
| `/scan-doc-kit` | `src/pages/ScanDocKit/ScanDocKit.tsx` | `Root`, protected | Scan kit document |
| `/mass-marking-scan` | `src/pages/MassMarkingEntry/MassMarkingEntry.tsx` | `Root`, protected | Return workflow entry |
| `/mass-marking-scan/editor` | `src/pages/MassMarkingScan/MassMarkingScan.tsx` | `Root`, protected | Return marking editor |
| `/series-photoes` | `src/pages/SeriesPhotos/SeriesPhotosEntry.tsx` | `Root`, protected | Enter transfer document number |
| `/series-photoes/:docNumber` | `src/pages/SeriesPhotos/SeriesPhotosList.tsx` | `Root`, protected | Select transfer product/series |
| `/series-photoes/:docNumber/:seriesUUID` | `src/pages/SeriesPhotos/SeriesPhotosDetails.tsx` | `Root`, protected | View, add, and retake series photos |

Note: the deployed URL spelling is `series-photoes` (not `series-photos`) and is consistently used by current navigation.

# Full router configuration

## `src/main.tsx`
```tsx
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
import Root from "./routes/root";
import Disaggregation from "./pages/Disaggregation/Disaggregation";
import BoxAggregation from "./pages/BoxAggregation/BoxAggregation";
import ScanBox from "./pages/ScanBox/ScanBox";
import CreateBox from "./pages/CreateBox/CreateBox";
import KitAggregation from "./pages/KitAggregation/KitAggregation.tsx";
import ScanDocKit from "./pages/ScanDocKit/ScanDocKit.tsx";
import MassMarkingScan from "./pages/MassMarkingScan/MassMarkingScan.tsx";
import MassMarkingEntry from "./pages/MassMarkingEntry/MassMarkingEntry.tsx";
import SeriesPhotosEntry from "./pages/SeriesPhotos/SeriesPhotosEntry.tsx";
import SeriesPhotosList from "./pages/SeriesPhotos/SeriesPhotosList.tsx";
import SeriesPhotosDetails from "./pages/SeriesPhotos/SeriesPhotosDetails.tsx";

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
      {
        path: "/disaggregation",
        element: <ProtectedRoute><Disaggregation /></ProtectedRoute>
      },
      {
        path: "/box-aggregation",
        element: <ProtectedRoute><BoxAggregation /></ProtectedRoute>
      },
      {
        path: "/scan-box",
        element: <ProtectedRoute><ScanBox /></ProtectedRoute>
      },
      {
        path: "/create-box",
        element: <ProtectedRoute><CreateBox /></ProtectedRoute>
      },
      {
        path: "/set-aggregation",
        element: <ProtectedRoute><KitAggregation /></ProtectedRoute>
      },
      {
        path: "/scan-doc-kit",
        element: <ProtectedRoute><ScanDocKit /></ProtectedRoute>
      },
      {
        path: "/mass-marking-scan",
        element: <ProtectedRoute><MassMarkingEntry /></ProtectedRoute>
      },
      {
        path: "/mass-marking-scan/editor",
        element: <ProtectedRoute><MassMarkingScan /></ProtectedRoute>
      },
      {
        path: "/series-photoes",
        element: <ProtectedRoute><SeriesPhotosEntry /></ProtectedRoute>
      },
      {
        path: "/series-photoes/:docNumber",
        element: <ProtectedRoute><SeriesPhotosList /></ProtectedRoute>
      },
      {
        path: "/series-photoes/:docNumber/:seriesUUID",
        element: <ProtectedRoute><SeriesPhotosDetails /></ProtectedRoute>
      }
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
```
