import { Fragment, useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { addDays, startOfDay } from 'date-fns';
import type { TaskPriority } from '../../lib/db';

interface QuickCaptureSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, priority: TaskPriority, dueDate: Date) => void;
  onMoreOptions: () => void;
}

type DateKey = 'today' | 'tomorrow' | 'this_week';

const DATE_OPTIONS: { key: DateKey; label: string; getDate: () => Date }[] = [
  { key: 'today', label: 'Today', getDate: () => startOfDay(new Date()) },
  { key: 'tomorrow', label: 'Tomorrow', getDate: () => addDays(startOfDay(new Date()), 1) },
  { key: 'this_week', label: 'This week', getDate: () => addDays(startOfDay(new Date()), 7) },
];

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    value: 'High',
    label: '🔴 High',
    activeClass: 'bg-red-500 border-red-500 text-white',
    inactiveClass: 'bg-white border-red-200 text-red-600',
  },
  {
    value: 'Medium',
    label: '🟡 Medium',
    activeClass: 'bg-amber-500 border-amber-500 text-white',
    inactiveClass: 'bg-white border-amber-200 text-amber-600',
  },
  {
    value: 'Low',
    label: '🟢 Low',
    activeClass: 'bg-green-500 border-green-500 text-white',
    inactiveClass: 'bg-white border-green-200 text-green-600',
  },
];

export default function QuickCaptureSheet({
  isOpen,
  onClose,
  onAdd,
  onMoreOptions,
}: QuickCaptureSheetProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dateKey, setDateKey] = useState<DateKey>('today');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when sheet opens
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Reset form state to defaults then close — ensures a clean slate next open
  const handleClose = () => {
    setTitle('');
    setPriority('Medium');
    setDateKey('today');
    onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const opt = DATE_OPTIONS.find(o => o.key === dateKey)!;
    onAdd(title.trim(), priority, opt.getDate());
    handleClose();
  };

  const handleMoreOptions = () => {
    handleClose();
    onMoreOptions();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 flex items-end justify-center pointer-events-none">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="translate-y-full opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="ease-in duration-200"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="translate-y-full opacity-0"
          >
            <Dialog.Panel className="pointer-events-auto w-full max-w-lg bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl">
              <div className="flex justify-center mb-5">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              <Dialog.Title className="sr-only">Add a recovery task</Dialog.Title>

              <input
                ref={inputRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder="Add a recovery task for today…"
                className="w-full text-base text-slate-800 placeholder-slate-400 border-0 border-b-2 border-slate-200 focus:border-slate-700 focus:outline-none pb-2 mb-6 bg-transparent transition-colors"
              />

              <div className="flex gap-2 mb-4">
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                      priority === p.value ? p.activeClass : p.inactiveClass
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                {DATE_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setDateKey(opt.key)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                      dateKey === opt.key
                        ? 'bg-slate-800 border-slate-800 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="w-full py-4 bg-slate-900 hover:bg-black active:scale-95 text-white font-bold rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm min-h-[56px]"
              >
                Add to Today
              </button>

              <button
                onClick={handleMoreOptions}
                className="w-full mt-3 py-3 text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
              >
                More options →
              </button>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
