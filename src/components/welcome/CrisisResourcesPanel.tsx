import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PhoneIcon, XMarkIcon, ExclamationTriangleIcon, MapPinIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { trackCrisisResourcesOpened } from '../../lib/telemetry';

interface CrisisResourcesPanelProps { isOpen: boolean; onClose: () => void; }

const MEETING_LINKS = [
  { name: 'Alcoholics Anonymous (AA)', url: 'https://www.aa.org/find-aa' },
  { name: 'Narcotics Anonymous (NA)', url: 'https://www.na.org/meetingsearch/' },
  { name: 'SMART Recovery', url: 'https://meetings.smartrecovery.org/meetings/' },
  { name: 'Recovery Dharma', url: 'https://recoverydharma.org/meetings/' },
  { name: 'Women for Sobriety', url: 'https://womenforsobriety.org/meetings/' },
];

/**
 * PROJ-116 crisis-bypass link target for the unauthenticated Welcome page.
 * A trimmed sibling of src/components/SOSModal.tsx's non-personalized
 * options only (988/911 + meeting finder) — deliberately excludes anything
 * that needs an authenticated, vault-unlocked session (sponsor-contact,
 * in-app deep links, vault-gated tools), which SOSModal assumes and a
 * pre-signup visitor doesn't have. Renders with zero auth/encryption
 * context providers — see CrisisResourcesPanel.test.tsx.
 */
export default function CrisisResourcesPanel({ isOpen, onClose }: CrisisResourcesPanelProps) {
  const [showMeetings, setShowMeetings] = useState(false);

  const handleOpen = () => {
    trackCrisisResourcesOpened();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment} afterEnter={handleOpen}>
      <Dialog as="div" className="relative z-[70]" onClose={onClose}>
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
                  <button type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none" onClick={onClose}>
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
                      You are not alone
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Help is available right now, no account needed.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <h4 className="font-bold text-red-900 flex items-center gap-2 mb-2">
                    <PhoneIcon className="h-5 w-5" />
                    Immediate Support
                  </h4>
                  <div className="flex gap-3">
                    <a href="tel:988" className="flex-1 bg-white border border-red-200 text-red-700 font-bold py-3 rounded-lg text-center shadow-sm hover:bg-red-600 hover:text-white transition-colors">
                      Call 988 (Lifeline)
                    </a>
                    <a href="tel:911" className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg text-center shadow-sm hover:bg-red-700 transition-colors">
                      Call 911
                    </a>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMeetings(!showMeetings)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                        <MapPinIcon className="w-5 h-5" />
                      </div>
                      <span className="font-bold">Find a Meeting</span>
                    </div>
                    <span className="text-sm font-medium text-slate-400">{showMeetings ? 'Hide' : 'Show'}</span>
                  </button>

                  {showMeetings && (
                    <div className="mt-3 flex flex-col gap-2">
                      {MEETING_LINKS.map((meeting) => (
                        <a
                          key={meeting.name}
                          href={meeting.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-600 group"
                        >
                          <span className="font-medium text-sm">{meeting.name}</span>
                          <ArrowTopRightOnSquareIcon className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
