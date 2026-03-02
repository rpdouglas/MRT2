import os

appshell_tsx_content = r'''/**
 * src/components/AppShell.tsx
 * GITHUB COMMENT:
 * [AppShell.tsx]
 * UX: Updated sidebar title to "My Recovery Toolkit" to match brand guidelines (Ticket 2.1).
 */
import { Fragment, type ReactNode, useEffect, useCallback, useState } from 'react';
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
  CommandLineIcon,
  WifiIcon,
  LockClosedIcon,
  ChatBubbleLeftRightIcon
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
import PWAInstallBanner from './PWAInstallBanner';
import FeedbackModal from './FeedbackModal';

export default function AppShell({ children }: { children: ReactNode }) {
  const { sidebarOpen, setSidebarOpen, isSOSOpen, setIsSOSOpen, isOnline } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, driveAccessToken, isAdmin } = useAuth();
  const { isVaultUnlocked, lockVault } = useEncryption();

  // Local State for Feedback
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setSidebarOpen(false); 
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleLock = () => {
      lockVault();
      setSidebarOpen(false);
      navigate('/dashboard');
  };

  const performAutoBackup = useCallback(async () => {
    if (!user || !db || !driveAccessToken || !isVaultUnlocked || !isOnline) return;
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
  }, [user, driveAccessToken, isVaultUnlocked, isOnline]);

  useEffect(() => {
    if (isVaultUnlocked && driveAccessToken && isOnline) {
      const timer = setTimeout(() => {
        performAutoBackup();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isVaultUnlocked, driveAccessToken, performAutoBackup, isOnline]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Journal', href: '/journal', icon: BookOpenIcon },
    { name: 'Vitality', href: '/vitality', icon: HeartIcon },
    { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Workbooks', href: '/workbooks', icon: AcademicCapIcon },
    { name: 'Insights', href: '/insights', icon: LightBulbIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ];

  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: CommandLineIcon });
  }

  return (
    <div className="min-h-screen relative">
      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
      
      {/* INTEGRATED FEEDBACK MODAL */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* OFFLINE INDICATOR */}
      {!isOnline && (
          <div className="bg-red-600 text-white text-xs font-bold text-center py-2 px-4 fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 shadow-md animate-slideDown">
              <WifiIcon className="h-4 w-4" />
              <span>You are offline. Data will save locally and sync when connection returns.</span>
          </div>
      )}

      {/* PWA INSTALL BANNER */}
      <PWAInstallBanner />

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
                   <div className="flex items-center gap-3 text-white font-bold text-[17px] tracking-tight whitespace-nowrap">
                      <div className="bg-white/10 p-1.5 rounded-lg shrink-0">
                        <img src="/favicon-32x32.png" alt="MRT Logo" className="h-6 w-6" />
                      </div>
                      My Recovery Toolkit
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

                          {/* FEEDBACK TRIGGER */}
                          <button
                              onClick={() => { setSidebarOpen(false); setIsFeedbackOpen(true); }}
                              className="group -mx-2 flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 text-blue-100 hover:bg-blue-800 hover:text-white w-full transition-colors"
                          >
                              <ChatBubbleLeftRightIcon className="h-6 w-6 shrink-0 text-blue-300 group-hover:text-white" aria-hidden="true" />
                              Send Feedback
                          </button>
                          
                          {/* LOCK VAULT BUTTON */}
                          {isVaultUnlocked && (
                            <button
                                onClick={handleLock}
                                className="group -mx-2 flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 text-blue-100 hover:bg-blue-800 hover:text-white w-full transition-colors"
                            >
                                <LockClosedIcon className="h-6 w-6 shrink-0 text-blue-300 group-hover:text-white" aria-hidden="true" />
                                Lock Vault
                            </button>
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

      <main className={`min-h-screen ${!isOnline ? 'pt-10' : ''}`}>
          {children}
      </main>
    </div>
  );
}
'''

vibrantheader_tsx_content = r'''/**
 * src/components/VibrantHeader.tsx
 * GITHUB COMMENT:
 * [VibrantHeader.tsx]
 * UX: Refactored grid layout to flex-1 anchor pattern for perfect title centering (Ticket 2.1).
 */
import { useLayout } from '../contexts/LayoutContext';
import { Bars3Icon, ExclamationTriangleIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import type { ElementType } from 'react';
import { useNavigate } from 'react-router-dom';

interface VibrantHeaderProps {
  title: string;
  subtitle: string;
  icon?: ElementType;
  fromColor: string; // e.g. "from-blue-600"
  viaColor: string;  // e.g. "via-indigo-600"
  toColor: string;   // e.g. "to-purple-600"
  percentage?: number;
  percentageColor?: string;
  backLink?: string; 
}

const ProgressRing = ({ percentage, colorHex }: { percentage: number; colorHex?: string }) => {
  const radius = 24; // Slightly smaller for the compact header
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={colorHex || "currentColor"}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-out" }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={!colorHex ? "text-white" : ""} 
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[10px] font-bold text-white drop-shadow-sm">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export default function VibrantHeader({
  title,
  subtitle,
  icon: Icon,
  fromColor,
  viaColor,
  toColor,
  percentage,
  percentageColor,
  backLink
}: VibrantHeaderProps) {
  const { toggleSidebar, toggleSOS } = useLayout();
  const navigate = useNavigate();

  return (
    <div className={`bg-gradient-to-r ${fromColor} ${viaColor} ${toColor} px-4 pt-4 pb-16 shadow-lg relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      {/* 3-Column Flex Layout for Perfect Centering */}
      <div className="relative z-20 flex items-center justify-between w-full">
        
        {/* Left: Hamburger or Back Arrow (Flex-1 anchors left side) */}
        <div className="flex-1 flex justify-start">
          {backLink ? (
            <button 
              onClick={() => navigate(backLink)}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-sm border border-white/20 active:scale-95"
              aria-label="Go Back"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          ) : (
            <button 
              onClick={toggleSidebar}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm border border-white/10 active:scale-95"
              aria-label="Open Menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Center: Title & Subtitle (Shrink-0 maintains width) */}
        <div className="shrink-0 flex flex-col items-center text-center px-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2 drop-shadow-md">
            {Icon && <Icon className="h-6 w-6 text-white/90 animate-pulse" />}
            {title}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm font-medium mt-0.5 tracking-wide">
            {subtitle}
          </p>
        </div>

        {/* Right: SOS & Stats (Flex-1 anchors right side) */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* Progress Ring (Optional) */}
          {percentage !== undefined && (
             <div className="hidden sm:block bg-white/10 backdrop-blur-md rounded-full p-1 shadow-inner border border-white/5">
                <ProgressRing percentage={percentage} colorHex={percentageColor} />
             </div>
          )}

          {/* SOS Button */}
          <button 
            onClick={toggleSOS}
            className="p-2.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white border border-red-400/50 transition-all backdrop-blur-md shadow-lg animate-pulse hover:animate-none active:scale-95"
            aria-label="Emergency SOS"
          >
            <ExclamationTriangleIcon className="h-6 w-6" />
          </button>
        </div>

      </div>
    </div>
  );
}
'''

createtaskmodal_tsx_content = r'''/**
 * src/components/tasks/TaskFormModal.tsx
 * GITHUB COMMENT:
 * [TaskFormModal.tsx]
 * UX: Rebranded "Quest" terminology to "Task" for a professional ledger feel (Ticket 2.1).
 */
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import type { RecurrenceConfig, RecurrenceType } from '../../lib/dateUtils';
import { Timestamp } from 'firebase/firestore';

// Define explicit union types locally
type CategoryType = 'Recovery' | 'Health' | 'Life' | 'Work';
type PriorityType = 'High' | 'Medium' | 'Low';

export interface TaskFormData {
  id?: string;
  title: string;
  category: CategoryType;
  priority: PriorityType;
  recurrence: RecurrenceConfig;
  dueDate: string; // YYYY-MM-DD
}

// Interface for the raw task data coming in
interface IncomingTask {
    id?: string;
    title: string;
    category?: CategoryType;
    priority: PriorityType;
    dueDate?: Timestamp | Date | null; 
    recurrence?: RecurrenceConfig;
    frequency?: string; 
}

interface TaskFormModalProps {
  isOpen: boolean;
  initialTask: IncomingTask | null; 
  onClose: () => void;
  onSave: (data: TaskFormData) => Promise<void>;
}

export default function TaskFormModal({ isOpen, initialTask, onClose, onSave }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('Recovery');
  const [priority, setPriority] = useState<PriorityType>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Recurrence State
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('once');
  const [relWeek, setRelWeek] = useState(1); 
  const [relDay, setRelDay] = useState(5); 

  useEffect(() => {
    if (isOpen) {
        if (initialTask) {
            setTitle(initialTask.title);
            setCategory(initialTask.category || 'Recovery');
            setPriority(initialTask.priority);
            
            let dateStr = '';
            if (initialTask.dueDate) {
                 const d = initialTask.dueDate instanceof Date 
                    ? initialTask.dueDate 
                    : (initialTask.dueDate as Timestamp).toDate();
                 dateStr = d.toISOString().split('T')[0];
            }
            setDueDate(dateStr);

            if (initialTask.recurrence) {
                setRecurrenceType(initialTask.recurrence.type);
                if (initialTask.recurrence.weekOfMonth) setRelWeek(initialTask.recurrence.weekOfMonth);
                if (initialTask.recurrence.dayOfWeek !== undefined) setRelDay(initialTask.recurrence.dayOfWeek);
            } else {
                setRecurrenceType(
                    (initialTask.frequency === 'once' || !initialTask.frequency) 
                    ? 'once' 
                    : initialTask.frequency as RecurrenceType
                );
            }

        } else {
            setTitle('');
            setCategory('Recovery');
            setPriority('Medium');
            setDueDate(new Date().toISOString().split('T')[0]);
            setRecurrenceType('once');
            setRelWeek(1);
            setRelDay(5);
        }
    }
  }, [isOpen, initialTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
        const config: RecurrenceConfig = {
            type: recurrenceType
        };

        if (recurrenceType === 'monthly-relative') {
            config.weekOfMonth = relWeek;
            config.dayOfWeek = relDay;
        }

        await onSave({
            id: initialTask?.id,
            title,
            category,
            priority,
            dueDate,
            recurrence: config
        });
        onClose();
    } catch (error) {
        console.error("Failed to save task", error);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                
                <div className="flex justify-between items-center mb-6">
                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                      {initialTask ? 'Edit Task' : 'New Task'}
                    </Dialog.Title>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* TITLE */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Task Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Morning Routine..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border-gray-300 focus:ring-slate-500 focus:border-slate-500 p-3 text-sm"
                            autoFocus={!initialTask}
                        />
                    </div>

                    {/* CATEGORY & PRIORITY */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value as CategoryType)}
                                className="w-full rounded-xl border-gray-300 text-sm py-2.5"
                            >
                                <option value="Recovery">Recovery</option>
                                <option value="Health">Health</option>
                                <option value="Life">Life</option>
                                <option value="Work">Work</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Priority</label>
                            <select 
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as PriorityType)}
                                className="w-full rounded-xl border-gray-300 text-sm py-2.5"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>

                    {/* RECURRENCE */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
                            <ArrowPathIcon className="h-4 w-4" />
                            Repetition
                        </div>
                        
                        <select 
                            value={recurrenceType}
                            onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                            className="w-full rounded-lg border-gray-300 text-sm"
                        >
                            <option value="once">One-time</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-Weekly</option>
                            <option value="monthly">Monthly (Same date)</option>
                            <option value="monthly-relative">Monthly (Relative day)</option>
                        </select>

                        {recurrenceType === 'monthly-relative' && (
                            <div className="flex gap-2 animate-fadeIn">
                                 <select 
                                    value={relWeek} 
                                    onChange={(e) => setRelWeek(Number(e.target.value))}
                                    className="flex-1 rounded-lg border-gray-300 text-sm"
                                 >
                                    <option value={1}>1st</option>
                                    <option value={2}>2nd</option>
                                    <option value={3}>3rd</option>
                                    <option value={4}>4th</option>
                                    <option value={5}>Last</option>
                                 </select>
                                 <select 
                                    value={relDay} 
                                    onChange={(e) => setRelDay(Number(e.target.value))}
                                    className="flex-1 rounded-lg border-gray-300 text-sm"
                                 >
                                    <option value={0}>Sunday</option>
                                    <option value={1}>Monday</option>
                                    <option value={2}>Tuesday</option>
                                    <option value={3}>Wednesday</option>
                                    <option value={4}>Thursday</option>
                                    <option value={5}>Friday</option>
                                    <option value={6}>Saturday</option>
                                 </select>
                            </div>
                        )}
                    </div>

                    {/* DUE DATE */}
                    <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Due Date</label>
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="date" 
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full pl-10 rounded-xl border-gray-300 text-sm py-2.5" 
                            />
                          </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!title.trim() || loading}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors shadow-md mt-4 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : initialTask ? 'Update Task' : 'Create Task'}
                    </button>
                </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
'''

dashboard_tsx_content = r'''/**
 * src/pages/Dashboard.tsx
 * GITHUB COMMENT:
 * [Dashboard.tsx]
 * UX: Updated Bento Grid terminology from Quests to Tasks/Habits (Ticket 2.1).
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  Timestamp,
  type Firestore 
} from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { 
  calculateJournalStats, 
  calculateTaskStats, 
  calculateWorkbookStats, 
  calculateVitalityStats,
  calculateUserLevel
} from '../lib/gamification';
import VibrantHeader from '../components/VibrantHeader';
import SobrietyHero from '../components/SobrietyHero';
import { 
  HomeIcon, 
  FireIcon, 
  ChartBarIcon, 
  SparklesIcon, 
  HeartIcon, 
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { THEME } from '../lib/theme';

const TOTAL_WORKBOOK_QUESTIONS = 45;

export default function Dashboard() {
  const { user } = useAuth();
  
  // --- QUERY 1: USER PROFILE ---
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: async () => {
        if (!user || !db) return null;
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
    },
    enabled: !!user,
    refetchOnMount: 'always', // FORCE REFRESH
  });

  // --- QUERY 2: JOURNALS ---
  const { data: journals = [], isLoading: journalLoading } = useQuery({
    queryKey: ['journals', user?.uid],
    queryFn: async () => {
        if (!user || !db) return [];
        const database: Firestore = db;
        const q = query(
            collection(database, 'journals'), 
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
            ...d.data(),
            createdAt: d.data().createdAt
        }));
    },
    enabled: !!user,
    refetchOnMount: 'always', // FORCE REFRESH
  });

  // --- QUERY 3: TASKS ---
  const { data: tasks = [], isLoading: taskLoading } = useQuery({
    queryKey: ['tasks', user?.uid],
    queryFn: async () => {
        if (!user || !db) return [];
        const database: Firestore = db;
        const q = query(collection(database, 'tasks'), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
    },
    enabled: !!user,
    refetchOnMount: 'always', // FORCE REFRESH
  });

  // --- QUERY 4: WORKBOOKS ---
  const { data: workbookCount = 0, isLoading: workbookLoading } = useQuery({
    queryKey: ['workbooks', user?.uid],
    queryFn: async () => {
        if (!user || !db) return 0;
        const database: Firestore = db;
        const q = query(collection(database, 'users', user.uid, 'workbook_answers'));
        const snap = await getDocs(q);
        return snap.size;
    },
    enabled: !!user,
    refetchOnMount: 'always', // FORCE REFRESH
  });

  // --- CALCULATE STATS ---
  const stats = useMemo(() => {
    if (journalLoading || taskLoading || workbookLoading || profileLoading) return null;

    // Sobriety date calculation
    let daysClean = 0;
    if (userProfile?.sobrietyDate) {
        const start = userProfile.sobrietyDate.toDate ? userProfile.sobrietyDate.toDate() : new Date(userProfile.sobrietyDate);
        const diffTime = Math.abs(new Date().getTime() - start.getTime());
        daysClean = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Gamification
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const jStats = calculateJournalStats(journals as any);
    const tStats = calculateTaskStats(tasks as any);
    const wStats = calculateWorkbookStats(workbookCount, TOTAL_WORKBOOK_QUESTIONS);
    const vStats = calculateVitalityStats(journals as any);
    const level = calculateUserLevel(journals as any, tasks as any, workbookCount, daysClean);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const lastExport = userProfile?.lastExportAt as Timestamp | undefined;
    
    // eslint-disable-next-line react-hooks/purity
    const nowMs = Date.now(); 
    const showBackup = !lastExport || lastExport.toMillis() < nowMs - (7 * 24 * 60 * 60 * 1000);

    return {
        journal: { streak: jStats.journalStreak, consistency: jStats.consistencyRate },
        task: { rate: tStats.completionRate, fire: tStats.habitFire },
        workbook: { wisdom: wStats.wisdomScore, completion: wStats.masterCompletion },
        vitality: { bioStreak: vStats.bioStreak, totalLogs: vStats.totalLogs },
        level,
        showBackup
    };
  }, [journals, tasks, workbookCount, userProfile, journalLoading, taskLoading, workbookLoading, profileLoading]);

  const loading = journalLoading || taskLoading || workbookLoading || profileLoading;

  if (loading || !stats) return <div className="p-8 text-center text-gray-500">Loading your recovery hub...</div>;

  // SRE FIX: Prefer the Database profile name over the Auth token name, fallback to Friend
  const firstName = (userProfile?.displayName || user?.displayName || 'Friend').split(' ')[0];

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.dashboard.page}`}>
      
      {/* 1. FIXED HEADER */}
      <div className="flex-shrink-0 z-10">
        <VibrantHeader 
            title="Dashboard" 
            subtitle={`Welcome back, ${firstName}`}
            icon={HomeIcon}
            fromColor={THEME.dashboard.header.from}
            viaColor={THEME.dashboard.header.via}
            toColor={THEME.dashboard.header.to}
        />
      </div>

      {/* 2. FLOATING HERO: Clean Time (Moved to Top) */}
      <div className="px-4 -mt-12 relative z-30 flex-shrink-0 animate-slideUp">
         <SobrietyHero date={userProfile?.sobrietyDate} />
      </div>

      {/* 3. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">
        
        {/* Backup Alert */}
        {stats.showBackup && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full text-amber-700">
                <ArrowDownTrayIcon className="h-5 w-5" />
              </div>
              <div className="text-xs text-amber-900">
                <strong>Backup Needed:</strong> It's been a week since your last save.
              </div>
            </div>
            <Link to="/profile" className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">Go</Link>
          </div>
        )}

        {/* 2x2 BENTO GRID */}
        <div className="grid grid-cols-2 gap-4">
            
            {/* 1. JOURNAL (Indigo/Violet) */}
            <Link to="/journal" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <ChartBarIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <ChartBarIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Journal</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.journal.streak}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Days</div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Consistency</span>
                        <span className="text-base font-bold">{stats.journal.consistency}/wk</span>
                    </div>
                </div>
            </Link>

            {/* 2. HABITS (Cyan/Teal) */}
            <Link to="/tasks" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <FireIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <FireIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Habits</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.task.fire}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Fire</div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Rate</span>
                        <span className="text-base font-bold">{stats.task.rate}%</span>
                    </div>
                </div>
            </Link>

            {/* 3. VITALITY (Orange/Rose) */}
            <Link to="/vitality" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <HeartIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <HeartIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Vitality</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.vitality.bioStreak}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Rhythm</div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Logs</span>
                        <span className="text-base font-bold">{stats.vitality.totalLogs}</span>
                    </div>
                </div>
            </Link>

            {/* 4. WISDOM (Emerald/Lime) */}
            <Link to="/workbooks" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-emerald-500 to-lime-600 text-white shadow-lg shadow-emerald-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <SparklesIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <SparklesIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Wisdom</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.workbook.completion}%</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Done</div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Score</span>
                        <span className="text-base font-bold">{stats.workbook.wisdom}</span>
                    </div>
                </div>
            </Link>

        </div>

        {/* 4. XP / RANK CARD (Moved to Bottom) */}
        {/* Glassmorphism Card with Theme Gradient Border */}
        <div className="relative rounded-3xl p-[2px] bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-400 shadow-xl shadow-blue-200/50">
            <div className="bg-white rounded-[22px] p-5 relative overflow-hidden h-full">
                
                {/* Background Texture */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-100 to-blue-50 rounded-bl-full opacity-60 pointer-events-none"></div>
                <SparklesIcon className="absolute top-4 right-4 h-12 w-12 text-blue-100/50 rotate-12" />

                <div className="relative z-10 flex justify-between items-end">
                    
                    {/* LEFT: Identity */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">
                            Current Rank
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 leading-none tracking-tight">
                            {stats.level.levelData.title}
                        </h3>
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg self-start">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Archetype</span>
                            <span className="text-xs font-bold text-indigo-600">{stats.level.archetype}</span>
                        </div>
                    </div>

                    {/* RIGHT: Level Stats */}
                    <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-sm font-bold text-slate-400">LVL</span>
                            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-sky-600 to-indigo-600 shadow-sm">
                                {stats.level.levelData.level}
                            </span>
                        </div>
                    </div>
                </div>
            
                {/* Progress Bar */}
                <div className="mt-5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                        <span>Progress</span>
                        <span>{stats.level.levelData.currentXP} / {stats.level.levelData.nextLevelXP} XP</span>
                    </div>
                    <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 transition-all duration-1000 ease-out relative"
                            style={{ width: `${stats.level.levelData.progressPercent}%` }}
                        >
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-white/30 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    # Use standard string replace for markdown protection protocol
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated: {path}")

if __name__ == "__main__":
    write_file("src/components/AppShell.tsx", appshell_tsx_content)
    write_file("src/components/VibrantHeader.tsx", vibrantheader_tsx_content)
    write_file("src/components/tasks/TaskFormModal.tsx", createtaskmodal_tsx_content)
    write_file("src/pages/Dashboard.tsx", dashboard_tsx_content)
    print("✨ Layout Centering and Terminology sweep complete.")