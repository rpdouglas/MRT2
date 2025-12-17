import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell'; 
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Profile from './pages/Profile';
import Login from './pages/Login'; 

// --- PROTECTED ROUTE WRAPPER ---
// If the user is not logged in, redirect them to /login
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

// --- MAIN APPLICATION ---
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route: Login Page */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes: Wrapped in AppShell (Navigation) */}
          <Route path="/" element={<AppShell />}>
            
            {/* Redirect root '/' to Dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="journal" element={
              <PrivateRoute>
                <Journal />
              </PrivateRoute>
            } />
            
            <Route path="profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
          </Route>
          
          {/* Catch-all: Redirect unknown URLs to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}