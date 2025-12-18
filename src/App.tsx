import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Workbooks from './pages/Workbooks'; // NEW
import WorkbookDetail from './pages/WorkbookDetail'; // NEW
import WorkbookSession from './pages/WorkbookSession'; // NEW
import AppShell from './components/AppShell';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/journal"
            element={
              <PrivateRoute>
                <Journal />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <Tasks />
              </PrivateRoute>
            }
          />
          {/* --- WORKBOOK ROUTES --- */}
          <Route
            path="/workbooks"
            element={
              <PrivateRoute>
                <Workbooks />
              </PrivateRoute>
            }
          />
          <Route
            path="/workbooks/:workbookId"
            element={
              <PrivateRoute>
                <WorkbookDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/workbooks/:workbookId/session/:sectionId"
            element={
              <PrivateRoute>
                <WorkbookSession />
              </PrivateRoute>
            }
          />
          {/* ----------------------- */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}