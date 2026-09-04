import type { ElementType } from 'react';
import { Link } from 'react-router-dom';
import { DevicePhoneMobileIcon, BookOpenIcon, PlayCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { ASSETS } from '../data/assets';

interface LinkItem { id: string; title: string; subtitle?: string; url: string; isExternal: boolean; icon: ElementType; colorClass: string; }

const LINKS: LinkItem[] = [
  {
    id: 'open_app',
    title: 'Open Web App',
    subtitle: 'Access your private recovery toolkit',
    url: '/',
    isExternal: false,
    icon: DevicePhoneMobileIcon,
    colorClass: 'from-blue-500 to-indigo-600 shadow-blue-500/20'
  },
  {
    id: 'install_guide',
    title: 'Install App Guide',
    subtitle: 'How to add MRT to your home screen',
    url: 'https://rpdouglas.github.io/MRT2/guide/installation',
    isExternal: true,
    icon: BookOpenIcon,
    colorClass: 'from-emerald-500 to-teal-600 shadow-emerald-500/20'
  },
  {
    id: 'watch_demo',
    title: 'Watch the Demo',
    subtitle: 'See the platform in action',
    url: 'https://www.youtube.com/watch?v=BgQSM98W50I',
    isExternal: true,
    icon: PlayCircleIcon,
    colorClass: 'from-rose-500 to-pink-600 shadow-rose-500/20'
  },
  {
    id: 'contact',
    title: 'Contact Support',
    subtitle: 'Reach out for help or feedback',
    url: 'mailto:support@myrecoverytoolkit.ca',
    isExternal: true,
    icon: EnvelopeIcon,
    colorClass: 'from-slate-500 to-slate-700 shadow-slate-500/20'
  }
];

export default function Links() {
  return (
    <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center py-12 px-4 sm:px-6 relative overflow-x-hidden font-sans">
      
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Profile Header */}
      <div className="relative z-10 flex flex-col items-center mb-10 w-full max-w-md animate-fadeIn pt-4">
        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-400 to-fuchsia-500 shadow-2xl mb-5 border-2 border-slate-900">
          <img
            src={ASSETS.pwa_192x192}
            alt="MRT Logo"
            className="w-full h-full rounded-full bg-slate-900 object-contain p-2"
          />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md text-center">
          My Recovery Toolkit
        </h1>
        <p className="text-blue-200 text-sm font-medium mt-2 text-center max-w-xs leading-relaxed">
          The safest place to do the hardest work.
        </p>
      </div>

      {/* Interactive Link List */}
      <div className="relative z-10 w-full max-w-md space-y-4 animate-slideUp">
        {LINKS.map((link) => {
          const LinkContent = (
            <div className="flex items-center p-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl transition-all group-hover:bg-white/20 group-hover:border-white/30 shadow-xl">
              <div className={`p-3.5 rounded-xl bg-gradient-to-br ${link.colorClass} shadow-lg mr-4 shrink-0`}>
                <link.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col flex-1 text-left min-w-0">
                <span className="text-base font-bold text-white leading-tight mb-1 truncate">
                  {link.title}
                </span>
                {link.subtitle && (
                  <span className="text-xs text-slate-300 font-medium truncate">
                    {link.subtitle}
                  </span>
                )}
              </div>
            </div>
          );

          return link.isExternal ? (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group active:scale-95 transition-transform"
            >
              {LinkContent}
            </a>
          ) : (
            <Link
              key={link.id}
              to={link.url}
              className="block group active:scale-95 transition-transform"
            >
              {LinkContent}
            </Link>
          );
        })}
      </div>

      {/* Trust Footer */}
      <div className="relative z-10 mt-16 pb-8 text-center animate-fadeIn opacity-80">
        <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">
          Zero-Knowledge Encrypted • Private
        </p>
      </div>

    </div>
  );
}
