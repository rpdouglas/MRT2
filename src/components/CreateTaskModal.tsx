import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  PlusIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { addTask, type Frequency, type Priority } from '../lib/tasks';
import { useAuth } from '../contexts/AuthContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
}

export default function CreateTaskModal({ isOpen, onClose, onTaskAdded }: CreateTaskModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [dueDateStr, setDueDateStr] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setLoading(true);
    try {
      // Convert input string to Date (noon to avoid TZ issues)
      const [y, m, d] = dueDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d, 12, 0, 0);

      await addTask(
          user.uid, 
          title, 
          isRecurring ? frequency : 'once', 
          priority, 
          dateObj
      );
      
      // Reset & Close
      setTitle('');
      setIsRecurring(false);
      setPriority('Medium');
      setDueDateStr(new Date().toISOString().split('T')[0]);
      onTaskAdded();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                
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

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <PlusIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Create New Quest
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Add a new habit or task to your recovery ledger.
                      </p>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        
                        {/* Title */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Task Name</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="e.g. Call Sponsor, Gym, Meditate"
                                autoFocus
                            />
                        </div>

                        {/* Date & Priority Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                {/* FIXED: Removed 'block' class, keeping 'flex' */}
                                <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                                    <CalendarDaysIcon className="h-3 w-3" /> Due Date
                                </label>
                                <input 
                                    type="date"
                                    value={dueDateStr}
                                    onChange={(e) => setDueDateStr(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm"
                                />
                            </div>
                            <div>
                                {/* FIXED: Removed 'block' class, keeping 'flex' */}
                                <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                                    <FlagIcon className="h-3 w-3" /> Priority
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as Priority)}
                                    className="w-full rounded-lg border-gray-300 text-sm"
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Recurring Toggle */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="recurring" className="text-sm text-gray-700 font-medium flex items-center gap-2">
                                    <ArrowPathIcon className="h-4 w-4 text-gray-400" />
                                    Make this a Recurring Habit?
                                </label>
                            </div>
                            
                            {isRecurring && (
                                <div className="mt-3 pl-6 animate-fadeIn">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Frequency</label>
                                    <div className="flex gap-2">
                                        {(['daily', 'weekly', 'monthly'] as Frequency[]).map((freq) => (
                                            <button
                                                key={freq}
                                                type="button"
                                                onClick={() => setFrequency(freq)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize border transition-colors ${
                                                    frequency === freq 
                                                    ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {freq}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="mt-5 sm:mt-6">
                            <button
                                type="submit"
                                disabled={!title.trim() || loading}
                                className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Task'}
                            </button>
                        </div>
                    </form>

                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}