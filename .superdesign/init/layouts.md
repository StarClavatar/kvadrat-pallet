# Shared layouts

The application has no visual navigation shell, sidebar, footer, or breadcrumb shared across routes. Its shared layout is a provider/loading boundary plus route guards. Individual pages render their own headers and navigation.

## Root outlet/loading layout
- Path: `src/routes/root.tsx`
- Description: Wraps all child routes in the value provider and overlays the shared loader while global work is in progress.

```tsx
import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import ValueContextProvider, { ValueContext } from '../context/valueContext';
import Loader from '../components/Loader/Loader';

const AppContent = () => {
    const { isLoading } = useContext(ValueContext);
    return (
        <>
            {isLoading && <Loader />}
            <Outlet />
        </>
    );
};

const Root: React.FC = () => {
    return (
        <ValueContextProvider>
            <AppContent />
        </ValueContextProvider>
    );
};

export default Root;
```

## Authentication route wrapper
- Path: `src/auth/ProtectedRoute/ProtectedRoute.tsx`
- Description: Shared non-visual route wrapper that redirects unauthenticated users to `/`.

```tsx
// ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { PinContext } from "../../context/PinAuthContext";

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { pinAuthData } = React.useContext(PinContext);
  const location = useLocation();

  if (!pinAuthData) {
    // Если нет данных авторизации, перенаправляем на главную страницу
    return <Navigate to="/" state={{ from: location }} />;
  }

  // Если данные авторизации есть, рендерим дочерние элементы
  return children;
};

export default ProtectedRoute;
```

## Home application composition
- Path: `src/App.tsx`
- Description: Home-route composition that renders PIN entry and the global service-worker update prompt.

```tsx
import { useState, useEffect } from "react";
import "./App.css";
import EntryPage from "./pages/EntryPage/EntryPage";
import UpdatePrompt from "./components/UpdatePrompt/UpdatePrompt";

function App() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => void) | null>(null);

  useEffect(() => {
    const handleSWUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<() => void>;
      setShowUpdatePrompt(true);
      setUpdateSW(() => customEvent.detail);
    };

    document.addEventListener('swUpdate', handleSWUpdate);

    return () => {
      document.removeEventListener('swUpdate', handleSWUpdate);
    };
  }, []);

  const handleUpdate = () => {
    if (updateSW) {
      updateSW();
    }
  };

  const handleClose = () => {
    setShowUpdatePrompt(false);
  };

  return (
    <>
      <EntryPage />
      {showUpdatePrompt && <UpdatePrompt onUpdate={handleUpdate} onClose={handleClose} />}
    </>
  );
}

export default App;
```
