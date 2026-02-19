import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { InvestorDashboard } from './pages/investor/Dashboard';
import { InvestorSharePrices } from './pages/investor/SharePrices';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminUsers } from './pages/admin/Users';
import { AdminSharePrices } from './pages/admin/SharePrices';
import { AdminHoldings } from './pages/admin/Holdings';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Investor Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['investor']}>
                <InvestorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/shares"
            element={
              <ProtectedRoute allowedRoles={['investor']}>
                <InvestorSharePrices />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shares"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSharePrices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/holdings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminHoldings />
              </ProtectedRoute>
            }
          />
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
