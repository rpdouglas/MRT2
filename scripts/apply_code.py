import os
import json

# -----------------------------------------------------------------------------
# SAFE FILE WRITER
# -----------------------------------------------------------------------------
def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # Replace the markdown safeguard '~~~' with standard triple backticks '```'
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Created/Updated: {path}")

# =============================================================================
# 1. REACT APP CLEANUP (App.tsx & DataManagement.tsx)
# =============================================================================

app_tsx_content = r"""/**
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
"""

data_management_content = r"""/**
 * GITHUB COMMENT:
 * [DataManagement.tsx]
 * UPDATED: Switched 'View User Guide' button to an external <a> link pointing to the new VitePress site.
 * FIX: Removed unused 'useNavigate' import from react-router-dom.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, type Firestore } from 'firebase/firestore';
import { fetchAllUserData } from '../../lib/db';
import { prepareDataForExport, generateJSON, generatePDF } from '../../lib/exporter';
import { importLegacyJournals } from '../../lib/importer';
import { 
    ArrowDownTrayIcon, 
    ArrowUpTrayIcon, 
    DocumentTextIcon, 
    CodeBracketSquareIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    LockClosedIcon,
    CloudArrowUpIcon,
    BookOpenIcon
} from '@heroicons/react/24/outline';

export default function DataManagement() {
    const { user, driveAccessToken } = useAuth();
    const { isVaultUnlocked } = useEncryption();
    
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [exportError, setExportError] = useState<string | null>(null);
    const [lastExportStr, setLastExportStr] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<string | null>(null);

    const loadLastExportDate = useCallback(async () => {
        if (!user || !db) return;
        const database: Firestore = db;
        const snap = await getDoc(doc(database, 'users', user.uid));
        if (snap.exists() && snap.data().lastExportAt) {
            const date = snap.data().lastExportAt.toDate() as Date;
            setLastExportStr(date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
    }, [user]);

    useEffect(() => {
        loadLastExportDate();
    }, [loadLastExportDate]);

    const handleExport = async (format: 'json' | 'pdf') => {
        if (!user || !db) return;
        if (!isVaultUnlocked) {
            setExportError("Please unlock your vault (go to Journal) before exporting data.");
            return;
        }

        setExporting(true);
        setProgress(0);
        setExportError(null);

        try {
            const rawData = await fetchAllUserData(user.uid);
            setProgress(10);

            const cleanData = await prepareDataForExport(rawData, (p) => setProgress(10 + Math.floor(p * 0.8)));
            
            let blob: Blob;
            let filename: string;
            const dateStr = new Date().toISOString().split('T')[0];

            if (format === 'json') {
                blob = generateJSON(cleanData);
                filename = `mrt-backup-${dateStr}.json`;
            } else {
                blob = await generatePDF(cleanData);
                filename = `mrt-journal-${dateStr}.pdf`;
            }
            setProgress(100);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            const database: Firestore = db;
            const userRef = doc(database, 'users', user.uid);
            await setDoc(userRef, { lastExportAt: serverTimestamp() }, { merge: true });
            loadLastExportDate();

        } catch (error) {
            console.error("Export failed", error);
            setExportError("Failed to generate export. Check console.");
        } finally {
            setTimeout(() => setExporting(false), 2000);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
    
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
          setImportStatus('Error: Please select a valid JSON file.');
          return;
        }
    
        setImporting(true);
        setImportStatus('Reading file and mapping data...');
    
        try {
          const result = await importLegacyJournals(user.uid, file);
          setImportStatus(`Success! Imported ${result.success} entries. (${result.errors} skipped)`);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
          console.error("Import failed", error);
          setImportStatus('Error: Import failed. Check console for details.');
        } finally {
          setImporting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* USER GUIDE CTA (Updated to external link) */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <BookOpenIcon className="h-7 w-7" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">New to MRT?</h3>
                        <p className="text-blue-100 text-sm">Explore our visual guide to master your recovery tools.</p>
                    </div>
                </div>
                <a 
                    href="https://rpdouglas.github.io/MRT2/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center w-full py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors active:scale-95 shadow-md"
                >
                    View User Guide
                </a>
            </div>

            {/* GOOGLE DRIVE SYNC STATUS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CloudArrowUpIcon className="h-5 w-5 text-blue-600" />
                        Cloud Auto-Sync
                    </h3>
                    {driveAccessToken ? (
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded border border-green-200">Active</span>
                    ) : (
                        <span className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold uppercase rounded border border-gray-200">Inactive</span>
                    )}
                </div>
                
                {driveAccessToken ? (
                    <div className="text-sm text-gray-600 space-y-2">
                        <p>Linked to <strong>Google Drive</strong>. Your data is backed up automatically every 7 days when the vault is unlocked.</p>
                        {lastExportStr && <p className="text-xs font-medium text-gray-400 italic">Last Cloud Sync: {lastExportStr}</p>}
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">
                        Automatic backups are only available for users who signed in with Google. Email users must perform manual exports.
                    </p>
                )}
            </div>

            {/* MANUAL EXPORT */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <ArrowDownTrayIcon className="h-5 w-5 text-blue-600" />
                    Data Sovereignty (Manual Export)
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                    Download a copy of your data. You can save a raw JSON backup or a readable PDF.
                    <span className="block mt-2 text-orange-600 text-xs font-semibold bg-orange-50 p-2 rounded border border-orange-100">
                        <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />
                        Warning: Exported files are NOT encrypted. Store them securely.
                    </span>
                </p>

                {!isVaultUnlocked ? (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                        <LockClosedIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-3">Vault is locked. Please unlock to decrypt data.</p>
                        <button disabled className="bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed">
                            Unlock Required
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleExport('json')}
                            disabled={exporting}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
                        >
                            <CodeBracketSquareIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                            <span className="font-bold text-gray-700 group-hover:text-blue-700">JSON Backup</span>
                            <span className="text-xs text-gray-400">Machine-readable format</span>
                        </button>

                        <button 
                            onClick={() => handleExport('pdf')}
                            disabled={exporting}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all group"
                        >
                            <DocumentTextIcon className="h-8 w-8 text-gray-400 group-hover:text-red-600 mb-2" />
                            <span className="font-bold text-gray-700 group-hover:text-red-700">PDF Document</span>
                            <span className="text-xs text-gray-400">Readable format</span>
                        </button>
                    </div>
                )}

                {exporting && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Processing Vault...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {exportError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                        {exportError}
                    </div>
                )}
            </div>

            {/* IMPORT */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ArrowUpTrayIcon className="h-5 w-5 text-gray-500" />
                    Import Legacy Data
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Restore data from a JSON backup. This will add entries to your history.
                </p>

                <div className="flex flex-col gap-4">
                    <input 
                        type="file" 
                        accept=".json"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex flex-col items-center justify-center gap-2"
                    >
                        {importing ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        ) : (
                            <ArrowUpTrayIcon className="h-8 w-8" />
                        )}
                        <span className="font-medium">{importing ? 'Importing...' : 'Click to Select JSON File'}</span>
                    </button>

                    {importStatus && (
                        <div className={`flex items-start gap-2 text-sm p-3 rounded-md ${importStatus.includes('Success') ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                            {importStatus.includes('Success') ? (
                                <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                            ) : (
                                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                            )}
                            {importStatus}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
"""

# =============================================================================
# 2. VITEPRESS DOCUMENTATION (docs-site/*)
# =============================================================================

vp_config = r"""import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "My Recovery Toolkit",
  description: "Documentation and User Guide",
  base: '/MRT2/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide' }
    ],
    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'User Guide', link: '/guide' },
          { text: 'Privacy Policy', link: '/privacy' },
          { text: 'Terms of Service', link: '/tos' }
        ]
      }
    ]
  }
})
"""

vp_index = r"""---
layout: home

hero:
  name: "My Recovery Toolkit"
  text: "Documentation & Resources"
  tagline: The safest place to do the hardest work.
  actions:
    - theme: brand
      text: Read the Guide
      link: /guide
    - theme: alt
      text: Open App
      link: https://myrecoverytoolkit.web.app
---
"""

vp_guide = r"""# 📘 User Guide: The 4 Pillars

Welcome to the official manual for My Recovery Toolkit. 

## 1. The Horizon (Dashboard)
The Dashboard is your command center. It tracks your **Clean Time** and provides a 4-pillar overview of your mental, physical, and spiritual momentum.

## 2. Recovery Vault (Security)
MRT uses **AES-GCM encryption**. Your data is locked behind a 4-digit PIN. We utilize a zero-knowledge model: we never store your PIN, and we cannot reset it.
> **Warning:** If your PIN is lost, cloud data is unrecoverable. Ensure you utilize the Google Drive Auto-Backup or manual exports regularly.

## 3. The Deep Dive (Journaling)
Journaling is the core of MRT. Use **Smart Templates** to prompt your reflection, and consult the **Analysis Wizard** to track emotional patterns over time.

## 4. The Spark & Pulse
* **Quests:** Manage daily habits. If you miss a recurring habit, the system performs a Smart Reset to help you start fresh tomorrow without guilt.
* **Vitality:** Regulate your nervous system with the built-in 4-7-8 Breathing Tool. 
"""

vp_privacy = r"""# 🔒 Privacy Policy 

**My Recovery Toolkit ("MRT", "we", "our")** is committed to protecting your privacy.

## 1. Our Core Philosophy: Zero-Knowledge Encryption
MRT is built on a **Zero-Knowledge Architecture**.
* **Your Private Data:** Your Journal entries and Workbook answers are encrypted on your device.
* **Our Access:** We cannot decrypt or read this data.
* **Your Responsibility:** Because we do not have your encryption key, we cannot recover your data if you lose your PIN.

## 2. Information We Collect
* **Account & Metadata (Unencrypted):** Email address, usage streaks, unencrypted task titles, and mood scores.
* **User Generated Content (Encrypted):** The text body of your journals and workbooks.

## 3. How We Use Artificial Intelligence (AI)
MRT uses Google Gemini for coaching. AI analysis only happens when you explicitly click a button. Data is processed statelessly and is **NOT** used to train Google's public AI models.
"""

vp_tos = r"""# 📜 Terms of Service

## 1. Medical Disclaimer (Critical)
**MRT IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE MEDICAL ADVICE.**
The content, AI analysis, and tools provided are for informational and self-help purposes only. In an emergency, call 911 immediately.

## 2. Zero-Knowledge & Data Loss
You are solely responsible for remembering your PIN. We cannot reset your PIN or recover encrypted data if you forget it.

## 3. AI Features
Artificial Intelligence can make mistakes ("hallucinations"). You acknowledge that advice generated by the AI may be inaccurate.
"""

# =============================================================================
# 3. GITHUB ACTION & PACKAGE.JSON
# =============================================================================

github_action_docs = r"""name: Deploy Docs

on:
  push:
    branches: [main]
    paths:
      - 'docs-site/**'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install
      - name: Build VitePress
        run: npm run docs:build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs-site/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
"""

def update_package_json():
    pkg_path = "package.json"
    if not os.path.exists(pkg_path):
        return

    with open(pkg_path, "r") as f:
        pkg = json.load(f)

    # Inject Vitepress scripts
    if "scripts" not in pkg:
        pkg["scripts"] = {}
    
    pkg["scripts"]["docs:dev"] = "vitepress dev docs-site"
    pkg["scripts"]["docs:build"] = "vitepress build docs-site"

    # Inject DevDependency
    if "devDependencies" not in pkg:
        pkg["devDependencies"] = {}
    
    pkg["devDependencies"]["vitepress"] = "^3.5.0"

    with open(pkg_path, "w") as f:
        json.dump(pkg, f, indent=2)
    
    print("✅ Updated: package.json (Added VitePress scripts and dependencies)")

# =============================================================================
# EXECUTION
# =============================================================================

if __name__ == "__main__":
    print("🚀 Initiating Sprint 4.3 - The Knowledge Base...")
    
    # 1. Update React Files
    write_file("src/App.tsx", app_tsx_content)
    write_file("src/components/profile/DataManagement.tsx", data_management_content)
    
    # 2. Delete old UserGuide
    try:
        os.remove("src/pages/UserGuide.tsx")
        print("🗑️  Deleted: src/pages/UserGuide.tsx")
    except FileNotFoundError:
        print("⏭️  Skipped deleting UserGuide.tsx (Already removed)")

    # 3. Scaffold VitePress
    write_file("docs-site/.vitepress/config.mts", vp_config)
    write_file("docs-site/index.md", vp_index)
    write_file("docs-site/guide.md", vp_guide)
    write_file("docs-site/privacy.md", vp_privacy)
    write_file("docs-site/tos.md", vp_tos)

    # 4. Setup Actions & Package
    write_file(".github/workflows/deploy-docs.yaml", github_action_docs)
    update_package_json()

    print("\n✨ Knowledge Base infrastructure scaffolded successfully.")
    print("👉 NEXT STEPS:")
    print("   1. Run 'npm install' to install VitePress.")
    print("   2. Run 'npm run lint' and 'npm run build' to verify App integrity.")
    print("   3. Run 'npm run docs:dev' to preview the new documentation site locally.")q