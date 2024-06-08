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
