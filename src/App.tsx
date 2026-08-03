import { Toaster } from 'sonner';
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EncryptionProvider } from './contexts/EncryptionContext';
import { LayoutProvider } from './contexts/LayoutContext';
import Login from './pages/Login';
import Welcome from './pages/Welcome'; 
import Links from './pages/Links';
import DeleteAccount from './pages/DeleteAccount';
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
const RecoveryCapital = lazy(() => import('./pages/RecoveryCapital')); // PROJ-49
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PremiumUpgrade = lazy(() => import('./pages/PremiumUpgrade')); 
const ToolsHub = lazy(() => import('./pages/ToolsHub'));
const ToolHistory = lazy(() => import('./pages/ToolHistory'));
const CBATool = lazy(() => import('./components/smart_tools/CBATool').then(m => ({ default: m.CBATool })));
const ABCTool = lazy(() => import('./components/smart_tools/ABCTool').then(m => ({ default: m.ABCTool })));
const DentsTool = lazy(() => import('./components/smart_tools/DentsTool').then(m => ({ default: m.DentsTool })));
const PersonifyTool = lazy(() => import('./components/smart_tools/PersonifyTool').then(m => ({ default: m.PersonifyTool })));
const LifestyleBalanceTool = lazy(() => import('./components/smart_tools/LifestyleBalanceTool').then(m => ({ default: m.LifestyleBalanceTool })));
const ThoughtRecordTool = lazy(() => import('./components/smart_tools/ThoughtRecordTool').then(m => ({ default: m.ThoughtRecordTool })));
const FiveQuestionsTool = lazy(() => import('./components/smart_tools/FiveQuestionsTool').then(m => ({ default: m.FiveQuestionsTool })));
const MorningIntentTool = lazy(() => import('./components/smart_tools/MorningIntentTool').then(m => ({ default: m.MorningIntentTool }))); // PROJ-72
const UrgeSurfer = lazy(() => import('./pages/UrgeSurfer')); // PROJ-10
const ResentmentBurner = lazy(() => import('./components/smart_tools/ResentmentBurner')); // PROJ-28
const GamesHub = lazy(() => import('./pages/GamesHub')); // PROJ-72
const CravingBuster = lazy(() => import('./components/games/CravingBuster')); // PROJ-72
const RecoveryJeopardy = lazy(() => import('./components/games/jeopardy/RecoveryJeopardy')); // PROJ-72
const FastLane = lazy(() => import('./components/games/fastLane/FastLane')); // PROJ-72
const GoalLadder = lazy(() => import('./components/games/goalLadder/GoalLadder')); // PROJ-72
const ThoughtChallenge = lazy(() => import('./components/games/thoughtChallenge/ThoughtChallenge')); // PROJ-72
const TriggerMatch = lazy(() => import('./components/games/triggerMatch/TriggerMatch')); // PROJ-72
const KnowledgeQuests = lazy(() => import('./components/games/knowledgeQuests/KnowledgeQuests')); // PROJ-72
const DailyCrossword = lazy(() => import('./components/games/crossword/DailyCrossword')); // PROJ-79

// --- QUERY CLIENT ---
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30, retry: 1, refetchOnWindowFocus: false }
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
        <Toaster position="bottom-center" theme="light" />
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
                        <Route path="/links" element={<Links />} />
                        <Route path="/delete-account" element={<DeleteAccount />} />
                        
                        {/* PROTECTED ROUTES */}
                        <Route path="/dashboard" element={<PrivateRoute>
                            <Dashboard />
                            </PrivateRoute>} />
                        
                        <Route path="/journal" element={<PrivateRoute>
                            <VaultGate>
                                <Journal />
                            </VaultGate>
                            </PrivateRoute>} />
                        
                        <Route path="/tasks" element={<PrivateRoute>
                            <Tasks />
                            </PrivateRoute>} />
                        
                        <Route path="/workbooks" element={<PrivateRoute>
                                <VaultGate>
                                <Workbooks />
                                </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/workbooks/:workbookId" element={<PrivateRoute>
                            <VaultGate>
                                <WorkbookDetail />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/workbooks/:workbookId/session/:sectionId" element={<PrivateRoute>
                            <VaultGate>
                                <WorkbookSession />
                            </VaultGate>
                            </PrivateRoute>} />
                        
                        <Route path="/vitality" element={<PrivateRoute>
                            <VaultGate>
                                <Vitality />
                            </VaultGate>
                            </PrivateRoute>} />

                        <Route path="/tools" element={<PrivateRoute>
                            <ToolsHub />
                            </PrivateRoute>} />
                        <Route path="/tools/urge-surfer" element={<PrivateRoute>
                            <UrgeSurfer />
                            </PrivateRoute>} />
                        <Route path="/tools/resentment-burner" element={<PrivateRoute>
                            <ResentmentBurner />
                            </PrivateRoute>} />
                        <Route path="/tools/cba" element={<PrivateRoute>
                            <VaultGate>
                                <CBATool />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/tools/abc" element={<PrivateRoute>
                            <VaultGate>
                                <ABCTool />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/tools/dents" element={<PrivateRoute>
                            <VaultGate>
                                <DentsTool />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/tools/personify" element={<PrivateRoute>
                            <VaultGate>
                                <PersonifyTool />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/tools/lifestyle-balance" element={<PrivateRoute>
                            <VaultGate>
                                <LifestyleBalanceTool />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/tools/thought-record" element={<PrivateRoute>
                            <VaultGate>
                                <ThoughtRecordTool />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/tools/five-questions" element={<PrivateRoute>
                            <VaultGate>
                                <FiveQuestionsTool />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/tools/morning-intent" element={<PrivateRoute>
                            <VaultGate>
                                <MorningIntentTool />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/tools/:toolType/history" element={<PrivateRoute>
                            <VaultGate>
                                <ToolHistory />
                            </VaultGate>
                            </PrivateRoute>} />

                        <Route path="/games" element={<PrivateRoute>
                            <VaultGate>
                                <GamesHub />
                            </VaultGate>
                            </PrivateRoute>} />
                        {/* No VaultGate — crisis-tool precedent, matches /tools/urge-surfer. Score
                            persistence is a best-effort no-op if the vault happens to be locked. */}
                        <Route path="/games/craving-buster" element={<PrivateRoute>
                            <CravingBuster />
                            </PrivateRoute>} />
                        <Route path="/games/recovery-jeopardy" element={<PrivateRoute>
                            <VaultGate>
                                <RecoveryJeopardy />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/games/fast-lane" element={<PrivateRoute>
                            <VaultGate>
                                <FastLane />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/games/goal-ladder" element={<PrivateRoute>
                            <VaultGate>
                                <GoalLadder />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/games/thought-challenge" element={<PrivateRoute>
                            <VaultGate>
                                <ThoughtChallenge />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/games/trigger-match" element={<PrivateRoute>
                            <VaultGate>
                                <TriggerMatch />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/games/knowledge-quests" element={<PrivateRoute>
                            <VaultGate>
                                <KnowledgeQuests />
                            </VaultGate>
                            </PrivateRoute>} />
                        <Route path="/games/daily-crossword" element={<PrivateRoute>
                            <VaultGate>
                                <DailyCrossword />
                            </VaultGate>
                            </PrivateRoute>} />

                        <Route path="/insights" element={<PrivateRoute>
                                <VaultGate>
                                <InsightsLog />
                                </VaultGate>
                            </PrivateRoute>} />

                        <Route path="/insights/rosc" element={<PrivateRoute>
                                <VaultGate>
                                <RecoveryCapital />
                                </VaultGate>
                            </PrivateRoute>} />

                        <Route path="/templates" element={<PrivateRoute>
                            <TemplateEditor />
                            </PrivateRoute>} />
                        
                        <Route path="/profile" element={<PrivateRoute>
                                <Profile />
                            </PrivateRoute>} />

                        {/* Deep-linkable tab (Project 58 Phase 4) — /profile/general|security|data|achievements */}
                        <Route path="/profile/:tab" element={<PrivateRoute>
                                <Profile />
                            </PrivateRoute>} />

                        <Route path="/premium" element={<PrivateRoute>
                                <PremiumUpgrade />
                            </PrivateRoute>} />

                        <Route path="/admin" element={<PrivateRoute>
                                <AdminDashboard />
                            </PrivateRoute>} />
                        
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
