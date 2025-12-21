import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  PhoneIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon,
  HeartIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const navigate = useNavigate();

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
                
                {/* Close Button */}
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

                <div className="mt-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 sm:ml-3 sm:w-auto"
                    onClick={onClose}
                  >
                    Cancel
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