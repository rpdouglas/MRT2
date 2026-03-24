import os

FENCE = chr(96) * 3

def update_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.replace('__FENCE__', FENCE))
    print(f"✅ Repaired: {filepath}")

def main():
    print("🚀 Initiating UI Polish Fixes...\n")

    # 1. Update AppShell.tsx (Nav Menu Logo Background)
    update_file('src/components/AppShell.tsx', r"""/**
 * src/components/AppShell.tsx
 * GITHUB COMMENT:
 * [AppShell.tsx]
 * FIX: Replaced broken favicon-32x32.png with pwa-192x192.png for sidebar icon stability (Ticket 4.4).
 * FIX: Added solid white background to the sidebar logo for better contrast.
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
                      <div className="bg-white shadow-sm p-1.5 rounded-lg shrink-0">
                        {/* FIX: Updated Icon Path */}
                        <img src="/pwa-192x192.png" alt="MRT Logo" className="h-6 w-6 object-contain" />
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
""")

    # 2. Update VibrantHeader.tsx (Remove Pulse Animation from main icon)
    update_file('src/components/VibrantHeader.tsx', r"""import { useLayout } from '../contexts/LayoutContext';
import { Bars3Icon, ExclamationTriangleIcon, ChevronLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import type { ElementType } from 'react';
import { useNavigate } from 'react-router-dom';

interface VibrantHeaderProps {
  title: string;
  subtitle: string;
  icon?: ElementType;
  fromColor: string;
  viaColor: string;  
  toColor: string;   
  percentage?: number;
  percentageColor?: string;
  backLink?: string; 
}

const ProgressRing = ({ percentage, colorHex }: { percentage: number; colorHex?: string }) => {
  const radius = 24; 
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
            {Icon && <Icon className="h-6 w-6 text-white/90" />}
            {title}
            {Icon && <Icon className="h-6 w-6 text-white/90" />}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm font-medium mt-0.5 tracking-wide">
            {subtitle}
          </p>
        </div>

        {/* Right: Help, SOS & Stats (Flex-1 anchors right side) */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* Progress Ring (Optional) */}
          {percentage !== undefined && (
             <div className="hidden sm:block bg-white/10 backdrop-blur-md rounded-full p-1 shadow-inner border border-white/5">
                <ProgressRing percentage={percentage} colorHex={percentageColor} />
             </div>
          )}

          {/* Contextual Help Icon */}
          <a 
            href="https://rpdouglas.github.io/MRT2/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md shadow-sm border border-white/10 active:scale-95"
            aria-label="Help & Documentation"
          >
            <QuestionMarkCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </a>

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
""")

    # 3. Update JournalEditor.tsx (Responsive Dropdown Width)
    update_file('src/components/journal/JournalEditor.tsx', r"""import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { useJournalOperations } from '../../hooks/useJournalOperations';
import { db } from '../../lib/firebase';
import { collection, Timestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { 
    CheckIcon,
    Cog6ToothIcon,
    MapPinIcon,
    ArrowPathIcon,
    TagIcon,
    XMarkIcon,
    MicrophoneIcon,
    FaceSmileIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';
import { getUserTemplates, type JournalTemplate } from '../../lib/db';
import { DEFAULT_TEMPLATES } from '../../data/journalTemplates';
import { getCurrentWeather } from '../../lib/weather';
import { useNavigate } from 'react-router-dom';
import AudioRecorder from './AudioRecorder';
import type { AudioAnalysisResult } from '../../lib/gemini';

interface JournalDocData {
    tags?: string[];
    [key: string]: unknown;
}

export interface JournalEntry {
  id: string;
  content: string;
  moodScore: number;
  sentiment?: string;
  createdAt: Timestamp; 
  tags?: string[];
  weather?: { temp: number; condition: string } | null;
  isEncrypted?: boolean; 
}

interface ExtendedJournalTemplate extends JournalTemplate {
    content?: string;
}

interface JournalEditorProps {
  initialEntry: JournalEntry | null;
  initialTemplateId?: string | null;
  onSaveComplete: () => void;
}

export default function JournalEditor({ initialEntry, initialTemplateId, onSaveComplete }: JournalEditorProps) {
  const { user, userTier } = useAuth();
  const { encrypt } = useEncryption();
  const { addJournal, updateJournal } = useJournalOperations();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getSmartMood = () => {
      if (initialEntry) return initialEntry.moodScore;
      const cache = queryClient.getQueryData<JournalEntry[]>(['journals']);
      if (!cache || cache.length === 0) return 5;

      const recent = cache
        .filter((e: JournalEntry) => typeof e.moodScore === 'number' && e.moodScore > 0)
        .slice(0, 7);
      
      if (recent.length === 0) return 5;
      const sum = recent.reduce((acc: number, curr: JournalEntry) => acc + curr.moodScore, 0);
      return Math.round(sum / recent.length);
  };

  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState(getSmartMood); 
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  
  const [saving, setSaving] = useState(false); 
  const [weatherLoading, setWeatherLoading] = useState(false);
  
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [customTemplates, setCustomTemplates] = useState<JournalTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<JournalTemplate | null>(null);
  const [formAnswers, setFormAnswers] = useState<string[]>([]);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const fetchLocalWeather = useCallback(async () => {
    setWeatherLoading(true);
    try {
      const data = await getCurrentWeather();
      if (data) {
        setWeather({ temp: Math.round(data.temp), condition: data.condition });
      }
    } catch (e) {
      console.warn("Failed to auto-load weather", e);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const loadCustomTemplates = useCallback(async () => {
    if (!user) return;
    try {
        const t = await getUserTemplates(user.uid);
        setCustomTemplates(t);
    } catch (e) {
        console.error("Failed to load templates", e);
    }
  }, [user]);

  const loadUserTags = useCallback(async () => {
    if (!user || !db) return;
    try {
        const q = query(collection(db, 'journals'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        const tagSet = new Set<string>();
        snapshot.docs.forEach(doc => {
            const data = doc.data() as JournalDocData; 
            if (data.tags && Array.isArray(data.tags)) {
                data.tags.forEach((t: string) => tagSet.add(t));
            }
        });
        setAvailableTags(Array.from(tagSet).sort());
    } catch (e) {
        console.warn("Failed to load user tags", e);
    }
  }, [user]);

  const handleTemplateSelect = useCallback((tId: string) => {
    const defTemplate = DEFAULT_TEMPLATES.find(t => t.id === tId);
    if (defTemplate) {
        setNewEntry(defTemplate.content); 
        setTags(prev => [...new Set([...prev, ...defTemplate.tags])]);
        setActiveTemplate(null);
        return;
    }

    const custTemplate = customTemplates.find(t => t.id === tId) as ExtendedJournalTemplate | undefined;
    if (custTemplate) {
        if (custTemplate.content) {
            setNewEntry(custTemplate.content);
            setTags(prev => [...new Set([...prev, ...(custTemplate.defaultTags || [])])]);
            setActiveTemplate(null); 
        } 
        else if (custTemplate.prompts) {
            setActiveTemplate(custTemplate);
            setFormAnswers(new Array(custTemplate.prompts.length).fill(''));
            setNewEntry('');
            setTags(prev => [...new Set([...prev, ...(custTemplate.defaultTags || [])])]);
        }
    } else {
        setActiveTemplate(null);
        setNewEntry('');
        setTags([]);
    }
  }, [customTemplates]); 

  useEffect(() => {
    if (!user) return;
    loadCustomTemplates();
    loadUserTags();
    if (!initialEntry) fetchLocalWeather(); 
  }, [user, initialEntry, loadCustomTemplates, loadUserTags, fetchLocalWeather]);

  useEffect(() => {
    if (initialEntry) {
      setNewEntry(initialEntry.content);
      setMood(initialEntry.moodScore);
      setTags(initialEntry.tags || []);
      if (initialEntry.weather) setWeather(initialEntry.weather);
      setActiveTemplate(null);
    } else {
      setNewEntry('');
      setTags([]);
      setActiveTemplate(null);
      setFormAnswers([]);
      setWeather(null);
      fetchLocalWeather(); 
      if (initialTemplateId) handleTemplateSelect(initialTemplateId);
    }
  }, [initialEntry, initialTemplateId, handleTemplateSelect, fetchLocalWeather]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
        setTags(prev => prev.slice(0, -1));
    }
  };

  const addTag = (tagName: string) => {
    const cleanTag = tagName.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
    }
    setTagInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => setTags(tags.filter(t => t !== tagToRemove));

  const filteredSuggestions = availableTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t));

  const handleAudioComplete = (result: AudioAnalysisResult) => {
      setNewEntry(prev => (prev ? prev + "\n\n" + result.transcription : result.transcription));
      setMood(result.mood_score);
      setTags(prev => [...new Set([...prev, ...result.tags, "Voice Note"])]);
      setIsVoiceMode(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    const isFormValid = activeTemplate && formAnswers.some(a => a.trim() !== '');
    const isTextValid = !activeTemplate && newEntry.trim() !== '';
    if (!isFormValid && !isTextValid) return;

    setSaving(true);
    let plainContent = newEntry;
    if (activeTemplate) {
        plainContent = `**${activeTemplate.name}**\n\n`;
        activeTemplate.prompts.forEach((prompt, idx) => {
            plainContent += `**${prompt}**\n${formAnswers[idx] || '-(Skipped)-'}\n\n`;
        });
    }

    try {
      let contentToSave = plainContent;
      let isEncrypted = false;
      try {
        contentToSave = await encrypt(plainContent);
        isEncrypted = true;
      } catch (err) {
        console.error("Encryption failed", err);
        alert("Security Error: Could not encrypt. Save aborted.");
        setSaving(false);
        return;
      }

      if (initialEntry) {
        await updateJournal({ id: initialEntry.id, content: contentToSave, moodScore: mood, tags: tags, isEncrypted: isEncrypted });
      } else {
        await addJournal({ content: contentToSave, moodScore: mood, sentiment: 'Pending', weather: weather, tags: tags, isEncrypted: isEncrypted });
      }

      setNewEntry('');
      setFormAnswers([]);
      setActiveTemplate(null);
      setMood(getSmartMood());
      setTags([]);
      onSaveComplete();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-180px)] md:h-[600px] relative">
        <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center gap-3 shrink-0">
             <div>
                 {weather ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                      <span>{weather.condition}</span>
                      <span className="font-bold">{weather.temp}°C</span>
                      {!initialEntry && (
                          <button type="button" onClick={fetchLocalWeather} disabled={weatherLoading} className="ml-1 text-blue-400 hover:text-blue-600">
                              <ArrowPathIcon className={`h-3 w-3 ${weatherLoading ? 'animate-spin' : ''}`} />
                          </button>
                      )}
                    </div>
                ) : (
                    !initialEntry && (
                        <button type="button" onClick={fetchLocalWeather} disabled={weatherLoading} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 bg-white hover:bg-blue-50 px-2 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-sm">
                            {weatherLoading ? <ArrowPathIcon className="h-3 w-3 animate-spin" /> : <MapPinIcon className="h-3 w-3" />}
                            <span>Add Weather</span>
                        </button>
                    )
                )}
             </div>

             <div className="flex items-center gap-2">
                 <div className="relative">
                     <select 
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="pl-3 pr-8 py-1.5 text-xs sm:text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white w-[130px] sm:w-48 text-ellipsis overflow-hidden"
                        defaultValue=""
                        disabled={!!initialEntry} 
                    >
                        <option value="" disabled>Choose Template...</option>
                        <option value="none">Free Write</option>
                        <optgroup label="Standard">
                            {DEFAULT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </optgroup>
                        {customTemplates.length > 0 && (
                            <optgroup label="My Templates">
                                {customTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </optgroup>
                        )}
                    </select>
                 </div>

                 <button 
                    onClick={() => userTier === 'premium' ? navigate('/templates') : navigate('/premium')}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition"
                    title={userTier === 'premium' ? "Manage Templates" : "Premium Feature: Custom Templates"}
                 >
                    {userTier === 'premium' ? <Cog6ToothIcon className="h-5 w-5" /> : <LockClosedIcon className="h-5 w-5 text-amber-500" />}
                 </button>
             </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
            {isVoiceMode ? (
                <div className="h-full flex items-center justify-center">
                    <AudioRecorder onAnalysisComplete={handleAudioComplete} onCancel={() => setIsVoiceMode(false)} />
                </div>
            ) : activeTemplate ? (
                <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100 min-h-full">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-blue-900">{activeTemplate.name}</h3>
                        <button type="button" onClick={() => setActiveTemplate(null)} className="text-xs text-blue-500 hover:text-blue-700 underline">Switch to Text Mode</button>
                    </div>
                    {activeTemplate.prompts.map((prompt, idx) => (
                        <div key={idx}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{prompt}</label>
                            <textarea
                                rows={3} 
                                value={formAnswers[idx] || ''}
                                onChange={(e) => {
                                    const newAns = [...formAnswers];
                                    newAns[idx] = e.target.value;
                                    setFormAnswers(newAns);
                                }}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                placeholder="Type your answer..."
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <textarea
                    ref={textareaRef}
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    placeholder="How are you feeling today?"
                    className="w-full h-full p-2 rounded-xl border-none focus:ring-0 shadow-none resize-none text-gray-700 leading-relaxed font-mono text-base placeholder:text-gray-300"
                />
            )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50/95 backdrop-blur-sm p-3 shrink-0 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2">
                <FaceSmileIcon className={`h-5 w-5 ${mood >= 7 ? 'text-green-600' : mood <= 4 ? 'text-red-500' : 'text-yellow-600'}`} />
                <input 
                    type="range" min="1" max="10" value={mood}
                    onChange={(e) => setMood(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className={`text-xs font-bold w-6 text-center ${mood >= 7 ? 'text-green-700' : mood <= 4 ? 'text-red-700' : 'text-yellow-700'}`}>
                    {mood}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0 group">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                        <TagIcon className="h-4 w-4 text-gray-400 shrink-0" />
                        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar items-center">
                            {tags.map(tag => (
                                <span key={tag} className="flex-shrink-0 flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full border border-blue-100 whitespace-nowrap">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900"><XMarkIcon className="h-3 w-3" /></button>
                                </span>
                            ))}
                            <input 
                                type="text" value={tagInput}
                                onChange={(e) => { setTagInput(e.target.value); setShowSuggestions(true); }}
                                onKeyDown={handleAddTag}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder={tags.length === 0 ? "Add tags..." : ""}
                                className="min-w-[60px] text-xs border-none focus:ring-0 p-0 text-gray-700 placeholder:text-gray-400 bg-transparent"
                            />
                        </div>
                    </div>
                    {showSuggestions && tagInput && filteredSuggestions.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 w-full max-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 max-h-32 overflow-y-auto z-50">
                            {filteredSuggestions.map(tag => (
                                <button key={tag} type="button" className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors" onClick={() => addTag(tag)}>{tag}</button>
                            ))}
                        </div>
                    )}
                </div>

                <button type="button" onClick={() => setIsVoiceMode(true)} className="p-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors flex-shrink-0" title="Voice Note">
                    <MicrophoneIcon className="h-5 w-5" />
                </button>

                <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full shadow-md transition-all active:scale-95 flex-shrink-0 flex items-center gap-1 disabled:opacity-50">
                    {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                    <span className="hidden sm:inline">{initialEntry ? 'Update' : 'Save'}</span>
                </button>
            </div>
        </div>
    </div>
  );
}
""")

    print("\n🎉 UI Polish Fixes Complete! Execute `npm run build` and `npm run lint` to verify.")

if __name__ == "__main__":
    main()