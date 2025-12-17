import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Journal from './pages/Journal'; // Added Journal Import

// --- LOGIN SCREEN COMPONENT ---
function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full border-t-4 border-blue-600">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-blue-900 mb-2">My Recovery Toolkit</h1>
        <p className="text-gray-500 mb-6">One day at a time.</p>
        
        <button 
          onClick={loginWithGoogle}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-3"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}

// --- ROUTE GUARDS ---

// PrivateRoute: Wraps the protected page in the AppShell (Menu)
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // This is the ONLY place AppShell wraps content
  return <AppShell>{children}</AppShell>;
}

// PublicRoute: Redirects logged-in users to Dashboard
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a spinner

  if (user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public: Login */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginScreen />
            </PublicRoute>
          } />
          
          {/* Private: Dashboard */}
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          {/* Private: Profile */}
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />

          {/* Private: Journal (NEW) */}
          <Route path="/journal" element={
            <PrivateRoute>
              <Journal />
            </PrivateRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}