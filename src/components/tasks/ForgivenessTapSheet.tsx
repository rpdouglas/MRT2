import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { Task } from '../../lib/tasks';

interface ForgivenessTapSheetProps {
  isOpen: boolean;
  task: Task | null;
  onMoveToTomorrow: () => void;
  onKeepForToday: () => void;
}

export default function ForgivenessTapSheet({
  isOpen,
  task,
  onMoveToTomorrow,
  onKeepForToday,
}: ForgivenessTapSheetProps) {
  if (!task) return null;

  const streakSafe = (task.currentStreak ?? 0) > 0;
  const isNonRecurring = !task.isRecurring;

  let bodyText: string;
  if (isNonRecurring) {
    bodyText = 'Move this to tomorrow?';
  } else if (streakSafe) {
    bodyText = 'Your streak is safe — this is just one day.';
  } else {
    bodyText = 'Recovery continues tomorrow.';
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onKeepForToday}>
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
            <Dialog.Panel className="pointer-events-auto w-full max-w-lg bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl border-t-4 border-amber-400">
              <div className="flex justify-center mb-5">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              <p className="text-3xl text-center mb-3" role="img" aria-label="Autumn leaf">🍂</p>

              <Dialog.Title className="text-xl font-bold text-slate-800 text-center mb-2">
                Let today go
              </Dialog.Title>

              <p className="text-sm font-medium text-slate-600 text-center mb-1 line-clamp-2 px-4">
                "{task.title}"
              </p>

              <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed px-4">
                {bodyText}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={onMoveToTomorrow}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold rounded-2xl transition-all text-sm min-h-[56px]"
                >
                  Move to Tomorrow
                </button>
                <button
                  onClick={onKeepForToday}
                  className="w-full py-4 text-slate-600 hover:bg-slate-50 font-semibold rounded-2xl transition-colors text-sm min-h-[56px]"
                >
                  Keep for Today
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
