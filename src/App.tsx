import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Login Screen (Simplified for blue theme)
function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
       <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold text-blue-900 mb-2">My Recovery Toolkit</h1>
          <p className="text-gray-500 mb-6">Welcome back.</p>
          <button 
            onClick={loginWithGoogle} 
            className="w-full bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
          >
            Sign in with Google
          </button>
       </div>
    </div>
  );
}

// Private Route Wrapper - Applies AppShell
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // This is the ONLY place AppShell wraps content
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}