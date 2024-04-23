import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Workmode from './pages/Workmode/Workmode.tsx';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"; 
import './index.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/workmode",
    element: <Workmode/>
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
