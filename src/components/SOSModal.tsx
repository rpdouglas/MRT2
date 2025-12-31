/**
 * src/components/SOSModal.tsx
 * GITHUB COMMENT:
 * [SOSModal.tsx]
 * FIX: Resolved Firestore type mismatch error by ensuring db is typed as Firestore.
 */
import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  PhoneIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  HeartIcon,
  PencilSquareIcon,
  UserGroupIcon,
  ChatBubbleOvalLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, type Firestore } from 'firebase/firestore';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sponsorName, setSponsorName] = useState<string | null>(null);
  const [sponsorPhone, setSponsorPhone] = useState<string | null>(null);

  useEffect(() => {
      if (isOpen && user && db) {
          const fetchSponsor = async () => {
              try {
                  // Explicitly cast db to Firestore to satisfy TS
                  const database = db as Firestore;
                  const ref = doc(database, 'users', user.uid);
                  const snap = await getDoc(ref);
                  if (snap.exists()) {
                      const data = snap.data();
                      setSponsorName(data.sponsorName || null);
                      setSponsorPhone(data.sponsorPhone || null);
                  }
              } catch (e) {
                  console.error("Failed to load sponsor info", e);
              }
          };
          fetchSponsor();
      }
  }, [isOpen, user]);

  const handleNavigation = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border-t-8 border-red-500">
                
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start mb-6">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                      Crisis Support
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        You are not alone. Choose the support you need right now.
                      </p>
                    </div>
                  </div>
                </div>

                {/* OPTIONS GRID */}
                <div className="grid gap-4">
                    
                    {/* OPTION 0: SPONSOR CONNECT (New Feature) */}
                    {sponsorPhone && (
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                             <h4 className="font-bold text-emerald-900 flex items-center gap-2 mb-2">
                                <UserGroupIcon className="h-5 w-5" />
                                {sponsorName ? `Contact ${sponsorName}` : 'Contact Support'}
                             </h4>
                             <div className="flex gap-3">
                                <a 
                                    href={`tel:${sponsorPhone}`}
                                    className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-lg text-center shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <PhoneIcon className="h-4 w-4" /> Call
                                </a>
                                <a 
                                    href={`https://wa.me/${sponsorPhone.replace(/\D/g,'')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 bg-white border border-emerald-200 text-emerald-700 font-bold py-3 rounded-lg text-center shadow-sm hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ChatBubbleOvalLeftIcon className="h-4 w-4" /> WhatsApp
                                </a>
                             </div>
                        </div>
                    )}

                    {/* OPTION 1: CALL HELP */}
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <h4 className="font-bold text-red-900 flex items-center gap-2 mb-2">
                            <PhoneIcon className="h-5 w-5" />
                            Immediate Support
                        </h4>
                        <div className="flex gap-3">
                             <a 
                                href="tel:988" 
                                className="flex-1 bg-white border border-red-200 text-red-700 font-bold py-3 rounded-lg text-center shadow-sm hover:bg-red-600 hover:text-white transition-colors"
                             >
                                Call 988 (Lifeline)
                             </a>
                             <a 
                                href="tel:911" 
                                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg text-center shadow-sm hover:bg-red-700 transition-colors"
                             >
                                Call 911
                             </a>
                        </div>
                    </div>

                    {/* OPTION 2: BREATHE */}
                    <button 
                        onClick={() => handleNavigation('/vitality')}
                        className="group bg-blue-50 p-4 rounded-xl border border-blue-100 hover:border-blue-300 transition-all text-left"
                    >
                        <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-1">
                            <HeartIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            Ride the Wave (Breathwork)
                        </h4>
                        <p className="text-sm text-blue-700">
                            De-escalate your nervous system with 4-7-8 breathing. This feeling will pass.
                        </p>
                    </button>

                    {/* OPTION 3: JOURNAL (Urge Log) */}
                    <button 
                        onClick={() => handleNavigation('/journal?template=urge_log')}
                        className="group bg-purple-50 p-4 rounded-xl border border-purple-100 hover:border-purple-300 transition-all text-left"
                    >
                        <h4 className="font-bold text-purple-900 flex items-center gap-2 mb-1">
                            <PencilSquareIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            Log the Urge
                        </h4>
                        <p className="text-sm text-purple-700">
                            Process this craving using the "Urge Log" template. Get it out of your head.
                        </p>
                    </button>

                </div>

                <div className="mt-6 sm:flex sm:flex-row-reverse justify-between items-center">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 sm:ml-3 sm:w-auto"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  {!sponsorPhone && (
                      <button 
                        onClick={() => handleNavigation('/profile')}
                        className="mt-2 sm:mt-0 text-xs text-gray-500 hover:text-blue-600 underline"
                      >
                          Add Sponsor Contact Info
                      </button>
                  )}
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}