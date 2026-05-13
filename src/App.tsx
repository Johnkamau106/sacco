import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './views/Dashboard';
import Login from './views/Login';
import Register from './views/Register';
import Loans from './views/Loans';
import Transactions from './views/Transactions';
import Savings from './views/Savings';
import AdminPanel from './views/AdminPanel';
import Layout from './components/Layout';

import SplashScreen from './components/SplashScreen';
import { AnimatePresence } from 'motion/react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  
  if (loading) return <SplashScreen />;
  if (!isAdmin) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/loans" element={
              <ProtectedRoute>
                <Layout>
                  <Loans />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/transactions" element={
              <ProtectedRoute>
                <Layout>
                  <Transactions />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/savings" element={
              <ProtectedRoute>
                <Layout>
                  <Savings />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <AdminRoute>
                <Layout>
                  <AdminPanel />
                </Layout>
              </AdminRoute>
            } />
          </Routes>
        </AnimatePresence>
      </Router>
    </AuthProvider>
  );
}
