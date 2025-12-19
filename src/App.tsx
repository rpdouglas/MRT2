import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Workbooks from './pages/Workbooks'; 
import WorkbookDetail from './pages/WorkbookDetail'; 
import WorkbookSession from './pages/WorkbookSession'; 
// CRITICAL FIX: Import from the component folder, not pages
import TemplateEditor from './components/journal/TemplateEditor'; 
import AppShell from './components/AppShell';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  // AppShell is applied here, so we don't need to wrap it again in the Routes
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
          
          {/* --- TEMPLATES ROUTE --- */}
          <Route
            path="/templates"
            element={
              <PrivateRoute>
                <TemplateEditor />
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
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}