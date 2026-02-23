/**
 * src/App.tsx
 * UPDATED: PROJ-04 Sprint 3 (Removed UserGuide route, migrated to VitePress)
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EncryptionProvider } from './contexts/EncryptionContext';
import { LayoutProvider } from './contexts/LayoutContext';
import Login from './pages/Login';
import Welcome from './pages/Welcome'; 
import Dashboard from './pages/Dashboard';
import DebugTools from './pages/DebugTools';
import Journal from './pages/Journal';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Workbooks from './pages/Workbooks'; 
import WorkbookDetail from './pages/WorkbookDetail'; 
import WorkbookSession from './pages/WorkbookSession'; 
import TemplateEditor from './components/journal/TemplateEditor'; 
import AppShell from './components/AppShell';
import VaultGate from './components/VaultGate';
import ErrorBoundary from './components/ErrorBoundary';

// --- LAZY LOADED ROUTES ---
const Vitality = lazy(() => import('./pages/Vitality'));
const InsightsLog = lazy(() => import('./pages/InsightsLog'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// --- QUERY CLIENT ---
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, 
            retry: 1,
            refetchOnWindowFocus: false
        }
    }
});

// Loading Fallback Component
const RouteLoading = () => (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 animate-pulse">
        Loading...
    </div>
);

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <EncryptionProvider>
            <LayoutProvider>
                <Router>
                <Suspense fallback={<RouteLoading />}>
                    <Routes>
                        {/* PUBLIC ROUTES */}
                        <Route path="/" element={<Welcome />} />
                        <Route path="/login" element={<Login />} />
                        
                        {/* PROTECTED ROUTES */}
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

                        <Route
                        path="/admin"
                        element={
                            <PrivateRoute>
                                <AdminDashboard />
                            </PrivateRoute>
                        }
                        />
                        
                        {/* DEBUG TOOLS (Dev Only) */}
                        <Route path="/debug" element={<PrivateRoute><DebugTools /></PrivateRoute>} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Suspense>
                </Router>
            </LayoutProvider>
            </EncryptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
