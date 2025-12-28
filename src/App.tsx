/**
 * GITHUB COMMENT:
 * [App.tsx]
 * FIXED: Moved AdminGrant component inside AuthProvider to resolve 
 * "useAuth must be used within an AuthProvider" runtime error.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EncryptionProvider } from './contexts/EncryptionContext';
import { LayoutProvider } from './contexts/LayoutContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Workbooks from './pages/Workbooks'; 
import WorkbookDetail from './pages/WorkbookDetail'; 
import WorkbookSession from './pages/WorkbookSession'; 
import Vitality from './pages/Vitality';
import TemplateEditor from './components/journal/TemplateEditor'; 
import AppShell from './components/AppShell';
import InsightsLog from './pages/InsightsLog';
import AdminDashboard from './pages/AdminDashboard'; 
import VaultGate from './components/VaultGate';
import ErrorBoundary from './components/ErrorBoundary';
//import AdminGrant from './components/AdminGrant'; // TEMPORARY IMPORT

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
    <ErrorBoundary>
      <AuthProvider>
        <EncryptionProvider>
          <LayoutProvider>
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
                  
                  {/* PROTECTED ROUTES */}
                  <Route
                  path="/journal"
                  element={
                      <PrivateRoute>
                      <VaultGate>
                          <Journal />
                      </VaultGate>
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
                  
                  <Route
                  path="/workbooks"
                  element={
                      <PrivateRoute>
                          <VaultGate>
                          <Workbooks />
                          </VaultGate>
                      </PrivateRoute>
                  }
                  />
                  <Route
                  path="/workbooks/:workbookId"
                  element={
                      <PrivateRoute>
                      <VaultGate>
                          <WorkbookDetail />
                      </VaultGate>
                      </PrivateRoute>
                  }
                  />
                  <Route
                  path="/workbooks/:workbookId/session/:sectionId"
                  element={
                      <PrivateRoute>
                      <VaultGate>
                          <WorkbookSession />
                      </VaultGate>
                      </PrivateRoute>
                  }
                  />
                  
                  <Route
                  path="/vitality"
                  element={
                      <PrivateRoute>
                      <Vitality />
                      </PrivateRoute>
                  }
                  />

                  <Route
                  path="/insights"
                  element={
                      <PrivateRoute>
                          <VaultGate>
                          <InsightsLog />
                          </VaultGate>
                      </PrivateRoute>
                  }
                  />

                  <Route
                  path="/templates"
                  element={
                      <PrivateRoute>
                      <TemplateEditor />
                      </PrivateRoute>
                  }
                  />
                  
                  <Route
                  path="/profile"
                  element={
                      <PrivateRoute>
                          <Profile />
                      </PrivateRoute>
                  }
                  />

                  {/* ADMIN ROUTE */}
                  <Route
                  path="/admin"
                  element={
                      <PrivateRoute>
                          <AdminDashboard />
                      </PrivateRoute>
                  }
                  />
                  
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
              </Router>
          </LayoutProvider>
        </EncryptionProvider>
        {/* FIXED: Moved inside AuthProvider so useAuth works */}
     
      </AuthProvider>
    </ErrorBoundary>
  );
}