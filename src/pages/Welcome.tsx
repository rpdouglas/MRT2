// src/pages/Welcome.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface Persona {
  id: string;
  name: string;
  title: string;
  stage: string;
  image: string;
  color: string;
}

const PERSONAS: Persona[] = [
  {
    id: 'david',
    name: 'David',
    title: 'The Fresh Start',
    stage: 'Day 1',
    image: '/personas/david.jpg', // Assumes images are placed in public/personas/
    color: 'bg-blue-600'
  },
  {
    id: 'ned',
    name: 'Ned',
    title: 'The Pink Cloud',
    stage: '90 Days',
    image: '/personas/ned.jpg',
    color: 'bg-green-500'
  },
  {
    id: 'lisa',
    name: 'Lisa',
    title: 'Service Superstar',
    stage: '7 Years',
    image: '/personas/lisa.jpg',
    color: 'bg-purple-600'
  },
  {
    id: 'walt',
    name: 'Walt',
    title: 'The Zen Master',
    stage: '35+ Years',
    image: '/personas/walt.jpg',
    color: 'bg-amber-600'
  }
];

export default function Welcome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Smart Redirect: If user is already logged in, skip the splash page
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) return null; // Avoid flicker

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50">
      
      {/* HEADER SECTION */}
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 z-10">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <ShieldCheckIcon className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            My Recovery Toolkit
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">
            Your digital companion for the journey home.<br />
            From Day 1 to Year 35, we meet you where you are.
          </p>
        </div>
      </div>

      {/* PATHFINDER GRID (Bento Layout) */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
          {PERSONAS.map((persona) => (
            <div 
              key={persona.id}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white"
            >
              {/* Image Placeholder / Fallback */}
              <div className={`absolute inset-0 ${persona.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <img 
                src={persona.image} 
                alt={persona.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90"
                onError={(e) => {
                  // Fallback if image missing during dev
                  (e.target as HTMLImageElement).style.display = 'none'; 
                }}
              />
              
              {/* Text Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent p-4 flex flex-col justify-end text-white">
                <div className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-1 ${persona.color}`}>
                  {persona.stage}
                </div>
                <h3 className="font-bold text-lg leading-none">{persona.name}</h3>
                <p className="text-xs text-slate-300 font-medium truncate">{persona.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER CTA */}
      <div className="bg-white p-4 border-t border-slate-100 safe-area-bottom">
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Begin Your Journey</span>
            <ArrowRightIcon className="h-5 w-5" />
          </button>
          
          <p className="text-center text-xs text-slate-400 font-medium">
            Secure • Private • Encrypted
          </p>
        </div>
      </div>

    </div>
  );
}