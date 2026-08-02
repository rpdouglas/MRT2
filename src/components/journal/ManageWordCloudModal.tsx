import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EyeSlashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ManageWordCloudModalProps {
    isOpen: boolean;
    onClose: () => void;
    blockedWords: string[];
    onAddWord: (word: string) => void;
    onRemoveWord: (word: string) => void;
}

export default function ManageWordCloudModal({ isOpen, onClose, blockedWords, onAddWord, onRemoveWord }: ManageWordCloudModalProps) {
    const [newWord, setNewWord] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newWord.trim()) {
            onAddWord(newWord.trim().toLowerCase());
            setNewWord('');
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6 border border-slate-200">
                            
                            {/* Header */}
                            <div className="flex justify-between items-center mb-5">
                                <Dialog.Title as="h3" className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <EyeSlashIcon className="h-6 w-6 text-slate-500" />
                                    Manage Ignored Words
                                </Dialog.Title>
                                <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <p className="text-sm text-slate-500 mb-4">
                                Add words to hide them from your "Recurring Themes" cloud. This helps remove noise (names, places, etc.) so you can focus on what matters.
                            </p>

                            {/* Add Form */}
                            <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={newWord}
                                    onChange={(e) => setNewWord(e.target.value)}
                                    placeholder="e.g. 'work' or 'lunch'"
                                    className="flex-1 rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!newWord.trim()}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    aria-label="Add word"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                </button>
                            </form>

                            {/* List */}
                            <div className="bg-slate-50 rounded-xl p-4 min-h-[150px] max-h-[300px] overflow-y-auto border border-slate-100">
                                {blockedWords.length === 0 ? (
                                    <div className="text-center text-slate-400 text-xs py-8 italic">
                                        No custom words ignored yet.
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {blockedWords.map(word => (
                                            <span key={word} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                                                {word}
                                                <button 
                                                    onClick={() => onRemoveWord(word)}
                                                    className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <XMarkIcon className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                                    onClick={onClose}
                                >
                                    Done
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
