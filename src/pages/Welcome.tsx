/**
 * src/pages/Welcome.tsx
 * GITHUB COMMENT:
 * [Welcome.tsx]
 * FEAT: Redesigned landing page to modern Asymmetrical Layout (Sprint 1 - Ticket 1.1).
 * FEAT: Left column focuses on App Identity & Notebook LM Video demo.
 * FEAT: Built interactive Persona Grid with hover-bios and modal video players.
 * FIX: Centered Logo/Title/Blurb and moved CTA button below the video player.
 * UX: Reduced top padding and vertical spacing to pull content above the fold on desktop.
 * FIX: Updated image paths to /Marketing/ folder and aligned the bottom of the grid with the CTA button.
 */
import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowRightIcon, PlayCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

// --- Interfaces & Data ---
interface PersonaData { id: string; name: string; title: string; stage: string; headshot: string; bio: string; videoId: string; color: string; }

const PERSONAS: PersonaData[] = [
  { 
    id: 'david', name: 'David', title: 'The Fresh Start', stage: 'Day 1', 
    headshot: '/Marketing/david_headshot.png', bio: '/Marketing/david_bio.jpg', 
    videoId: 'Fg_j-OB5rKo', color: 'bg-blue-600' 
  },
  { 
    id: 'ned', name: 'Ned', title: 'The Pink Cloud', stage: '90 Days', 
    headshot: '/Marketing/ned_headshot.png', bio: '/Marketing/ned_bio.jpg', 
    videoId: 'XVme0G5vNIw', color: 'bg-emerald-500' 
  },
  { 
    id: 'lisa', name: 'Lisa', title: 'Service Superstar', stage: '7 Years', 
    headshot: '/Marketing/lisa_headshot.png', bio: '/Marketing/lisa_bio.jpg', 
    videoId: 'sPVdX2atLwI', color: 'bg-purple-600' 
  },
  { 
    id: 'walt', name: 'Walt', title: 'The Zen Master', stage: '35+ Years', 
    headshot: '/Marketing/walt_headshot.png', bio: '/Marketing/walt_bio.jpg', 
    videoId: 'JUv8jdG4wTE', color: 'bg-amber-600' 
  }
];

export default function Welcome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // State for the Video Modal
  const [selectedPersona, setSelectedPersona] = useState<PersonaData | null>(null);

  // Smart Redirect: If user is already logged in, skip the splash page
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) return null; // Avoid flicker

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-x-hidden">
      
      {/* MAIN CONTAINER: 60/40 Asymmetrical Split (Using items-stretch to match column heights) */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 lg:py-10 flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">
        
        {/* === LEFT COLUMN: BRAND & DEMO (60%) === */}
        <div className="w-full lg:w-[55%] flex flex-col items-center text-center space-y-5 lg:space-y-6 h-full">
            
            {/* Header Lockup (Centered, Single Line, Matched Heights) */}
            <div className="flex items-center justify-center gap-3 sm:gap-5 w-full">
                <img 
                    src="/maskable-icon-512x512.png" 
                    alt="MRT Logo" 
                    className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 object-cover shrink-0" 
                    onError={(e) => { (e.target as HTMLImageElement).src = '/pwa-192x192.png'; }}
                />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-none whitespace-nowrap">
                    My Recovery Toolkit
                </h1>
            </div>

            {/* Blurb (Centered) */}
            <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-xl mx-auto">
                Turn the noise of recovery into clear, actionable steps. Safely untangle your thoughts, spot emotional triggers before they lead to relapse, and build a life you don't want to escape from. Your private companion for the journey home.
            </p>

            {/* Platform Demo Video */}
            <div className="w-full relative mt-2">
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[2.5rem] -z-10 blur-xl opacity-70"></div>
                <div className="bg-white p-2 sm:p-3 rounded-3xl shadow-xl border border-slate-200 relative z-10">
                    <div className="aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
                        <iframe 
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/BgQSM98W50I?rel=0&modestbranding=1" 
                            title="My Recovery Toolkit Platform Overview" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </div>

            {/* CTA Button (mt-auto pushes it to the absolute bottom of the flex column) */}
            <div className="w-full pt-2 mt-auto">
                <button
                    onClick={() => navigate('/login')}
                    className="flex w-full justify-center items-center gap-3 px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95 active:translate-y-0"
                >
                    Begin Your Journey <ArrowRightIcon className="h-5 w-5 stroke-2" />
                </button>
            </div>
        </div>

        {/* === RIGHT COLUMN: INTERACTIVE PERSONAS (40%) === */}
        <div className="w-full lg:w-[45%] flex flex-col pt-4 lg:pt-0 h-full">
            <div className="mb-6 border-b border-slate-200 pb-5 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">Who is this for?</h2>
                <p className="text-slate-500 font-medium text-sm sm:text-base">We meet you exactly where you are. Tap to hear their stories.</p>
            </div>

            {/* 2x2 Grid (mt-auto pushes the grid to the absolute bottom, aligning with the CTA button) */}
            <div className="mt-auto grid grid-cols-2 gap-4 sm:gap-6">
              {PERSONAS.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPersona(p)}
                  className="relative aspect-square rounded-3xl overflow-hidden shadow-md border border-slate-200 cursor-pointer group bg-slate-100"
                >
                  {/* Base Headshot */}
                  <img 
                    src={p.headshot} 
                    alt={p.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0 z-10" 
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  
                  {/* Bio Image (Revealed on Desktop Hover) */}
                  <img 
                    src={p.bio} 
                    alt={`${p.name} Bio`} 
                    className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100 z-20 scale-105 group-hover:scale-100" 
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />

                  {/* Play Overlay */}
                  <div className="absolute inset-0 z-30 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent flex flex-col justify-end p-4 sm:p-5 transition-colors duration-500 group-hover:from-slate-900/95">
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm">
                             <PlayCircleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
                         </div>
                     </div>
                     <div className="relative transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                        <span className={`inline-block px-2.5 py-1 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wide mb-1.5 text-white shadow-sm ${p.color}`}>
                            {p.stage}
                        </span>
                        <h3 className="font-black text-white leading-none text-lg sm:text-xl drop-shadow-md">{p.name}</h3>
                     </div>
                  </div>
                </div>
              ))}
            </div>
        </div>

      </div>

      {/* Simple Footer text below main container */}
      <div className="w-full text-center pb-8 text-xs font-medium text-slate-400">
          Secure • Private • Encrypted
      </div>

      {/* === PERSONA VIDEO MODAL === */}
      <Transition appear show={selectedPersona !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedPersona(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-[2rem] bg-slate-50 text-left align-middle shadow-2xl transition-all border border-slate-200">
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-slate-100">
                      <div className="flex items-center gap-3">
                          <span className={`w-3.5 h-3.5 rounded-full shadow-sm ${selectedPersona?.color}`}></span>
                          <Dialog.Title as="h3" className="text-xl font-black text-slate-900 tracking-tight">
                            {selectedPersona?.name}'s Story
                          </Dialog.Title>
                      </div>
                      <button
                        type="button"
                        className="rounded-full p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 focus:outline-none transition-colors"
                        onClick={() => setSelectedPersona(null)}
                      >
                        <XMarkIcon className="h-6 w-6 stroke-2" aria-hidden="true" />
                      </button>
                  </div>

                  <div className="p-4 sm:p-6 bg-slate-100">
                      {/* Mobile Only: Show Bio Image above video since they can't hover to read it */}
                      <div className="lg:hidden mb-6 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                          {selectedPersona && <img src={selectedPersona.bio} alt={`${selectedPersona.name} Bio`} className="w-full h-auto object-cover" />}
                      </div>

                      {/* Universal: The Video Player */}
                      <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
                          {selectedPersona && (
                              <iframe 
                                  className="absolute inset-0 w-full h-full"
                                  src={`https://www.youtube.com/embed/${selectedPersona.videoId}?autoplay=1&rel=0&modestbranding=1`} 
                                  title={`${selectedPersona.name}'s Story`}
                                  frameBorder="0" 
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                  allowFullScreen
                              ></iframe>
                          )}
                      </div>
                  </div>
                  
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

    </div>
  );
}
