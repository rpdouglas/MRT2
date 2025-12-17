import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// 1. Simple Debug Navigation (No AppShell)
function DebugNav() {
  const { user, loginWithGoogle, logout } = useAuth();
  
  return (
    <nav className="p-4 bg-gray-200 border-b-4 border-red-500 mb-4 flex gap-4 items-center">
      <strong className="text-red-700">DEBUG MODE:</strong>
      <Link to="/" className="text-blue-600 underline">Dashboard</Link>
      <Link to="/profile" className="text-blue-600 underline">Profile</Link>
      
      <div className="ml-auto">
        {!user ? (
          <button onClick={loginWithGoogle} className="bg-blue-500 text-white px-3 py-1 rounded">
            Log In
          </button>
        ) : (
          <button onClick={logout} className="bg-gray-500 text-white px-3 py-1 rounded">
            Log Out ({user.displayName})
          </button>
        )}
      </div>
    </nav>
  );
}

// 2. Main App - No Layouts, just Routes inside a Red Box
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <DebugNav />
        
        <div className="p-4 border-4 border-red-500 m-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}