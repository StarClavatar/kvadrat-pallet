import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Workmode from './pages/Workmode/Workmode.tsx';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"; 
import './index.css'
import NewPallet from './pages/NewPallet/NewPallet.tsx';
import Pallet from './pages/Pallet/Pallet.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/workmode",
    element: <Workmode/>
  },
  {
    path: "/new-pallet",
    element: <NewPallet/>
  },
  {
    path: "/pallet/:sscc",
    element: <Pallet/>
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
