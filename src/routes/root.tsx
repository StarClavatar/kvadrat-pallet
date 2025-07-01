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
