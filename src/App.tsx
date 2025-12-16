import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile'; // Ensure you created this file in the previous step!

// --- 1. LOGIN SCREEN COMPONENT ---
function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-serene-teal to-teal-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01]">
        <div className="p-8 text-center">
          {/* Logo / Icon */}
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg className="w-10 h-10 text-serene-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Recovery Toolkit</h1>
          <p className="text-gray-500 mb-8">Your digital companion for the journey.</p>
          
          {/* Login Button */}
          <button 
            onClick={loginWithGoogle}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 hover:border-serene-teal hover:text-serene-teal transition duration-200 flex items-center justify-center gap-3 group"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
            <span>Continue with Google</span>
          </button>
          
          <p className="mt-6 text-xs text-gray-400">
            Secure authentication provided by Firebase
          </p>
        </div>
      </div>
    </div>
  );
}

// --- 2. ROUTE GUARDS ---

// Redirects to Login if not authenticated
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-serene-teal"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Wrap private pages in the AppShell (Navbar)
  return <AppShell>{children}</AppShell>;
}

// Redirects to Dashboard if already authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-serene-teal"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

// --- 3. MAIN APP COMPONENT ---
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route: Login */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginScreen />
            </PublicRoute>
          } />
          
          {/* Private Route: Dashboard */}
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          {/* Private Route: Profile */}
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />

          {/* Fallback: Redirect unknown routes to Dashboard */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}