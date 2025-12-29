/**
 * GITHUB COMMENT:
 * [UserGuide.tsx]
 * NEW: Implemented a native, interactive web-based user manual.
 * UI: Aligned with the "Vibrant Momentum" design tokens and theme.
 * ASSETS: Created 12 structural placeholders for Pixel 9 Pro XL screenshots.
 */
import { useNavigate } from 'react-router-dom';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { 
  BookOpenIcon, 
  ChevronLeftIcon, 
  ShieldCheckIcon, 
  SparklesIcon, 
  FireIcon, 
  HeartIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
  AcademicCapIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface PlaceholderProps {
  id: number;
  label: string;
}

const ScreenshotPlaceholder = ({ id, label }: PlaceholderProps) => (
  <div className="my-8 border-4 border-dashed border-slate-300 rounded-[2.5rem] bg-slate-50 flex flex-col items-center justify-center p-8 text-center aspect-[9/19.5] max-w-[280px] mx-auto shadow-inner group hover:bg-slate-100 transition-colors">
    <div className="bg-blue-600 text-white font-black rounded-full w-12 h-12 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
      {id}
    </div>
    <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.2em] leading-loose">
      Pixel 9 Pro XL<br/>
      <span className="text-slate-900 font-bold text-xs">{label}</span>
    </p>
  </div>
);

export default function UserGuide() {
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen pb-20 ${THEME.profile.page}`}>
      <VibrantHeader 
        title="User Guide"
        subtitle="Mastering your recovery companion."
        icon={BookOpenIcon}
        fromColor="from-slate-700"
        viaColor="via-slate-800"
        toColor="to-slate-900"
      />

      {/* Navigation Override */}
      <div className="absolute top-4 left-16 z-50">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md border border-white/10 text-xs font-bold transition-all active:scale-95"
        >
          <ChevronLeftIcon className="h-4 w-4" /> 
          BACK
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-8 relative z-30 space-y-12">
        
        {/* INTRODUCTION */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 animate-fadeIn">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <ShieldCheckIcon className="h-7 w-7 text-blue-600" />
            The Horizon
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            The Dashboard is your command center. It tracks your <strong>Clean Time</strong> and provides a 4-pillar overview of your mental, physical, and spiritual momentum.
          </p>
          <ScreenshotPlaceholder id={1} label="Dashboard View" />
        </section>

        {/* VAULT SECURITY */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <LockClosedIcon className="h-7 w-7 text-indigo-600" />
            Recovery Vault
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            MRT uses <strong>AES-GCM encryption</strong>. Your data is locked behind a 4-digit PIN. We utilize a zero-knowledge model: we never store your PIN, and we cannot reset it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ScreenshotPlaceholder id={2} label="Vault Lock Screen" />
            <ScreenshotPlaceholder id={3} label="Vault Setup UI" />
          </div>
          <div className="mt-6 bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              If the PIN is lost, cloud data is unrecoverable. Ensure you utilize the <strong>Google Drive Auto-Backup</strong> or manual exports regularly.
            </p>
          </div>
        </section>

        {/* JOURNALING */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <SparklesIcon className="h-7 w-7 text-violet-600" />
            The Deep Dive
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Journaling is the core of MRT. Use <strong>Smart Templates</strong> to prompt your reflection, and consult the <strong>Analysis Wizard</strong> to track emotional patterns over time.
          </p>
          <ScreenshotPlaceholder id={4} label="Journal Editor" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <ScreenshotPlaceholder id={5} label="Journal History" />
            <ScreenshotPlaceholder id={6} label="AI Analysis" />
          </div>
        </section>

        {/* QUESTS & VITALITY */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <FireIcon className="h-7 w-7 text-cyan-600" />
            The Spark & The Pulse
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Manage daily habits with <strong>Quests</strong>. If you miss a recurring habit, the system performs a <strong>Smart Reset</strong> to help you start fresh tomorrow without guilt.
          </p>
          <ScreenshotPlaceholder id={7} label="Quest Stream" />
          
          <div className="h-px bg-slate-100 my-10" />

          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <HeartIcon className="h-7 w-7 text-rose-600" />
            Vitality Tracking
          </h3>
          <p className="text-slate-600 leading-relaxed mb-6">
            Regulate your nervous system with the built-in <strong>4-7-8 Breathing Tool</strong>. Logs are automatically saved as tagged journal entries for long-term health insights.
          </p>
          <ScreenshotPlaceholder id={8} label="Breathwork Tool" />
        </section>

        {/* WORKBOOKS */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <AcademicCapIcon className="h-7 w-7 text-emerald-600" />
            The Library
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Structured 12-Step and Dharma modules help you do the "heavy lifting" of recovery. Progress is tracked through a <strong>Wisdom Score</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ScreenshotPlaceholder id={9} label="Workbook Index" />
            <ScreenshotPlaceholder id={10} label="Wisdom Log" />
          </div>
        </section>

        {/* EMERGENCY & ARCHIVE */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <LightBulbIcon className="h-7 w-7 text-blue-600" />
            Safety & Sovereignty
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            The pulsing <strong>SOS Modal</strong> provides immediate access to support lines. The Profile page ensures <strong>Data Sovereignty</strong>, allowing you to export or sync your data anytime.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ScreenshotPlaceholder id={11} label="SOS Modal" />
            <ScreenshotPlaceholder id={12} label="Profile & Sync" />
          </div>
        </section>

        {/* BACKUP REMINDER */}
        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-center text-white shadow-xl">
          <CloudArrowUpIcon className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold mb-2">Cloud Auto-Sync</h2>
          <p className="text-blue-100 text-sm leading-relaxed mb-6">
            Sign in with Google to enable automatic backups to your private Drive. MRT stores a readable backup every 7 days to ensure you never lose your progress.
          </p>
          <button 
            onClick={() => navigate('/profile')}
            className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-50 transition-colors active:scale-95"
          >
            Check Sync Status
          </button>
        </div>

      </div>
    </div>
  );
}