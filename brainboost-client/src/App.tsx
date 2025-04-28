import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Protected route component
import ProtectedRoute from './app/router/ProtectedRoute';

const App: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            {/* Add more routes as they are implemented */}
          </Route>
        </Route>
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default App;
