import React from 'react';
import { Outlet } from 'react-router-dom';
import ValueContextProvider from '../context/valueContext';

const Root: React.FC = () => {
    return (
        <ValueContextProvider>
            <Outlet />
        </ValueContextProvider>
    );
};

export default Root;
