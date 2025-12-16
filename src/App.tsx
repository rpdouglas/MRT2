import { AuthProvider, useAuth } from './contexts/AuthContext';

// A simple component to test the connection
function TestDashboard() {
  const { user, loginWithGoogle, logout } = useAuth();

  return (
    <div className="min-h-screen bg-serene-teal flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-deep-charcoal mb-4">
          My Recovery Toolkit
        </h1>
        <p className="text-healing-green mb-6 font-medium">
          Cloud Native Environment: <span className="text-hopeful-coral">Active</span>
        </p>

        {user ? (
          <div>
            <p className="mb-4 text-gray-600">Welcome, {user.displayName}!</p>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button 
            onClick={loginWithGoogle}
            className="px-4 py-2 bg-serene-teal text-white rounded hover:bg-teal-700 transition"
          >
            Sign In with Google
          </button>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TestDashboard />
    </AuthProvider>
  );
}

export default App;