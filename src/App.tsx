import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EncryptionProvider } from './contexts/EncryptionContext';
import { LayoutProvider } from './contexts/LayoutContext'; // NEW
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
import VaultGate from './components/VaultGate';

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
      <EncryptionProvider>
        {/* Wrap Router in LayoutProvider so all pages can access toggleSidebar */}
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
                
                {/* PROTECTED JOURNAL ROUTES */}
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
                
                {/* --- WORKBOOK ROUTES (Protected) --- */}
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
                
                {/* --- VITALITY ROUTE --- */}
                <Route
                path="/vitality"
                element={
                    <PrivateRoute>
                    <Vitality />
                    </PrivateRoute>
                }
                />

                {/* --- INSIGHTS ROUTE (Protected) --- */}
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
        </LayoutProvider>
      </EncryptionProvider>
    </AuthProvider>
  );
}