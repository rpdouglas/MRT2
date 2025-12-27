/**
 * GITHUB COMMENT:
 * [AppShell.tsx]
 * UPDATED: Added conditional 'Admin' menu item for users with the admin role.
 */
import { Fragment, type ReactNode, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  HomeIcon, 
  BookOpenIcon, 
  UserCircleIcon, 
  ArrowLeftOnRectangleIcon, 
  ClipboardDocumentListIcon, 
  AcademicCapIcon, 
  HeartIcon, 
  LightBulbIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, type Firestore, type Timestamp } from 'firebase/firestore';
import { fetchAllUserData } from '../lib/db';
import { prepareDataForExport, generateJSON } from '../lib/exporter';
import { findBackupFile, uploadBackupToDrive } from '../lib/googleDrive';
import SOSModal from './SOSModal';

export default function AppShell({ children }: { children: ReactNode }) {
  const { sidebarOpen, setSidebarOpen, isSOSOpen, setIsSOSOpen } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, driveAccessToken, isAdmin } = useAuth();
  const { isVaultUnlocked } = useEncryption();

  const handleLogout = async () => {
    try {
      setSidebarOpen(false); 
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const performAutoBackup = useCallback(async () => {
    if (!user || !db || !driveAccessToken || !isVaultUnlocked) return;
    const database: Firestore = db;

    try {
      const userRef = doc(database, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const lastExport = userData.lastExportAt as Timestamp | undefined;
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      if (lastExport && lastExport.toMillis() > sevenDaysAgo) return;

      const rawData = await fetchAllUserData(user.uid);
      const cleanData = await prepareDataForExport(rawData, () => {});
      const blob = generateJSON(cleanData);
      const textData = await blob.text();

      const existingFileId = await findBackupFile(driveAccessToken);
      const success = await uploadBackupToDrive(driveAccessToken, textData, existingFileId || undefined);

      if (success) {
        await setDoc(userRef, { lastExportAt: serverTimestamp() }, { merge: true });
        console.log("Background Auto-Backup Successful");
      }
    } catch (e) {
      console.error("Auto-backup failed silently:", e);
    }
  }, [user, driveAccessToken, isVaultUnlocked]);

  useEffect(() => {
    if (isVaultUnlocked && driveAccessToken) {
      const timer = setTimeout(() => {
        performAutoBackup();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isVaultUnlocked, driveAccessToken, performAutoBackup]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Journal', href: '/journal', icon: BookOpenIcon },
    { name: 'Vitality', href: '/vitality', icon: HeartIcon },
    { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Workbooks', href: '/workbooks', icon: AcademicCapIcon },
    { name: 'Insights', href: '/insights', icon: LightBulbIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ];

  // ADDED: Conditional Admin Link
  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: CommandLineIcon });
  }

  return (
    <div className="min-h-screen">
      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />

      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setSidebarOpen}>
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1 flex-col bg-gradient-to-b from-blue-700 to-blue-900 transition-all shadow-2xl">
                <div className="flex h-16 shrink-0 items-center justify-between px-6 pt-6">
                   <div className="flex items-center gap-3 text-white font-bold text-lg tracking-tight">
                      <div className="bg-white/10 p-1.5 rounded-lg">
                        <img src="/favicon-32x32.png" alt="" className="h-6 w-6" />
                      </div>
                      Recovery Toolkit
                   </div>
                   <button onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5 text-blue-200 hover:text-white transition-colors">
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <nav className="flex flex-1 flex-col px-6 pb-4 mt-8">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-all ${
                                location.pathname === item.href
                                  ? 'bg-blue-600/50 text-white shadow-inner border border-blue-500/30'
                                  : 'text-blue-100 hover:text-white hover:bg-blue-800'
                              }`}
                            >
                              <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                    
                    <li className="mt-auto">
                      <div className="flex flex-col gap-2 pt-6 border-t border-blue-500/30">
                         {user && (
                             <div className="flex items-center gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 text-white bg-blue-800/50 border border-blue-700/50">
                                 {user.photoURL ? (
                                     <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full bg-blue-700 border-2 border-white/20" />
                                 ) : (
                                     <UserCircleIcon className="h-8 w-8 text-blue-200" />
                                 )}
                                 <div className="flex flex-col truncate">
                                    <span className="sr-only">Your profile</span>
                                    <span aria-hidden="true">{user.displayName || 'User'}</span>
                                    <span className="text-xs text-blue-300 font-normal truncate opacity-80">{user.email}</span>
                                 </div>
                             </div>
                         )}
                         <button
                           onClick={handleLogout}
                           className="group -mx-2 flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 text-blue-200 hover:bg-red-500/20 hover:text-red-200 w-full transition-colors"
                         >
                           <ArrowLeftOnRectangleIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                            Log out
                         </button>
                      </div>
                    </li>
                  </ul>
                </nav>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <main className="min-h-screen">
          {children}
      </main>
    </div>
  );
}