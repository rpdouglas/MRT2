// src/components/journal/TemplatePickerSheet.tsx
// PROJ-93. Bottom-sheet template picker grouped by moment (In the Moment /
// Daily Rituals / Reflection & Insight / Free Write / My Templates),
// replacing the old flat <select>/<optgroup> grouped by clinical modality
// (PROJ-57). Structural pattern (Dialog/Transition backdrop + slide-up
// panel) copied from QuickCaptureSheet.tsx rather than invented fresh — see
// docs/projects/93_JOURNAL_TEMPLATE_MOMENT_GROUPING.md Strategy A.
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { JournalTemplate } from '../../lib/db';
import {
  DEFAULT_TEMPLATES,
  MOMENT_ORDER,
  MOMENT_META,
  FREE_WRITE_META,
  MY_TEMPLATES_META,
  type JournalMoment,
} from '../../data/journalTemplates';

interface TemplatePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  customTemplates: JournalTemplate[];
}

type SectionKey = JournalMoment | 'free-write' | 'my-templates';

function SectionDot({ color }: { color: string }) {
  return <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />;
}

export default function TemplatePickerSheet({ isOpen, onClose, onSelect, customTemplates }: TemplatePickerSheetProps) {
  const [openSection, setOpenSection] = useState<SectionKey>('in-the-moment');

  // Reset to the default section on close (not open) — mirrors
  // QuickCaptureSheet's handleClose resetting its own form state, so the
  // sheet always lands back on "In the Moment" the next time it opens.
  const handleClose = () => {
    setOpenSection('in-the-moment');
    onClose();
  };

  const handleSelect = (templateId: string) => {
    onSelect(templateId);
    handleClose();
  };

  const toggleSection = (key: SectionKey) => {
    setOpenSection((current) => (current === key ? ('' as SectionKey) : key));
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
            <Dialog.Panel className="pointer-events-auto w-full max-w-lg bg-indigo-200 rounded-t-3xl px-4 pt-5 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex justify-center mb-4 sticky top-0">
                <div className="w-10 h-1 bg-indigo-400/40 rounded-full" />
              </div>

              <Dialog.Title className="text-lg font-bold text-indigo-950 px-2 mb-4">Choose a Template</Dialog.Title>

              <div className="flex flex-col gap-3">
                {MOMENT_ORDER.map((moment) => {
                  const meta = MOMENT_META[moment];
                  const templates = DEFAULT_TEMPLATES.filter((t) => t.moment === moment);
                  const isOpenSection = openSection === moment;
                  return (
                    <div key={moment} className="rounded-2xl bg-white/70 border border-indigo-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleSection(moment)}
                        className="w-full flex items-center justify-between gap-3 p-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <SectionDot color={meta.dotColor} />
                          <div>
                            <p className="font-bold text-indigo-950 text-sm">{meta.label}</p>
                            <p className="text-xs text-indigo-500">{meta.subtitle}</p>
                          </div>
                        </div>
                        <ChevronDownIcon
                          className={`h-4 w-4 text-indigo-400 shrink-0 transition-transform ${isOpenSection ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isOpenSection && (
                        <div className="flex flex-col gap-2 px-3 pb-3">
                          {templates.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleSelect(t.id)}
                              className="w-full flex items-center justify-between gap-2 text-left px-4 py-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                            >
                              <span className="font-semibold text-indigo-900 text-sm">{t.name}</span>
                              <span className="text-[10px] font-medium text-indigo-400 bg-indigo-100 px-2 py-0.5 rounded-full shrink-0">
                                {t.group}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="rounded-2xl bg-white/70 border border-indigo-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('free-write')}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <SectionDot color={FREE_WRITE_META.dotColor} />
                      <div>
                        <p className="font-bold text-indigo-950 text-sm">{FREE_WRITE_META.label}</p>
                        <p className="text-xs text-indigo-500">{FREE_WRITE_META.subtitle}</p>
                      </div>
                    </div>
                    <ChevronDownIcon
                      className={`h-4 w-4 text-indigo-400 shrink-0 transition-transform ${openSection === 'free-write' ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openSection === 'free-write' && (
                    <div className="flex flex-col gap-2 px-3 pb-3">
                      <button
                        type="button"
                        onClick={() => handleSelect('none')}
                        className="w-full text-left px-4 py-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                      >
                        <span className="font-semibold text-indigo-900 text-sm">Start with a blank page</span>
                      </button>
                    </div>
                  )}
                </div>

                {customTemplates.length > 0 && (
                  <div className="rounded-2xl bg-white/70 border border-indigo-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection('my-templates')}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <SectionDot color={MY_TEMPLATES_META.dotColor} />
                        <div>
                          <p className="font-bold text-indigo-950 text-sm">{MY_TEMPLATES_META.label}</p>
                          <p className="text-xs text-indigo-500">{MY_TEMPLATES_META.subtitle}</p>
                        </div>
                      </div>
                      <ChevronDownIcon
                        className={`h-4 w-4 text-indigo-400 shrink-0 transition-transform ${openSection === 'my-templates' ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {openSection === 'my-templates' && (
                      <div className="flex flex-col gap-2 px-3 pb-3">
                        {customTemplates.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelect(t.id)}
                            className="w-full text-left px-4 py-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                          >
                            <span className="font-semibold text-indigo-900 text-sm">{t.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
