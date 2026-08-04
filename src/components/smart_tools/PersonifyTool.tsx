/**
 * src/components/smart_tools/PersonifyTool.tsx
 * PROJ-27: The CBT Engine
 * Modernized Personify & Disarm tool using a "Rogue's Gallery" Card Grid.
 */

import React, { useState } from 'react';
import { SmartToolContainer } from './SmartToolContainer';
import { InformationCircleIcon, PlusIcon, TrashIcon, PencilSquareIcon, CheckIcon, XMarkIcon, UserCircleIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { PersonifyPayload } from '../../lib/types/smart';

const EXPLANATION = "Narrative Therapy uses 'externalization' to create emotional distance from addiction. By giving your addictive voice a name and character (e.g., 'The Negotiator', 'The Victim'), you separate your True Self from the urges. This makes it easier to observe the lies it tells and disarm them with the truth.";

interface Persona { id: number; name: string; action: string; result: string; }

interface PersonaCardProps { persona: Persona; onUpdate: (updatedPersona: Persona) => void; onDelete: (id: number) => void; }

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(persona.name);
    const [editAction, setEditAction] = useState(persona.action);
    const [editResult, setEditResult] = useState(persona.result);

    const handleSave = () => {
        if (!editName.trim()) return;
        onUpdate({
            ...persona,
            name: editName.trim(),
            action: editAction.trim(),
            result: editResult.trim()
        });
        setIsEditing(false);
    };

    const handleCancel = () => { setEditName(persona.name); setEditAction(persona.action); setEditResult(persona.result); setIsEditing(false); };

    if (isEditing) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-400 p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div>
                    <label htmlFor={`personify-name-${persona.id}`} className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rogue's Name</label>
                    <input
                        id={`personify-name-${persona.id}`}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g., The Negotiator"
                        className="w-full text-sm font-bold rounded-xl border-gray-300 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 p-2.5"
                    />
                </div>
                <div>
                    <label htmlFor={`personify-action-${persona.id}`} className="block text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">The Lie It Tells</label>
                    <textarea
                        id={`personify-action-${persona.id}`}
                        rows={2}
                        value={editAction}
                        onChange={(e) => setEditAction(e.target.value)}
                        placeholder="What does it say to convince you to use?"
                        className="w-full text-sm rounded-xl border-rose-200 focus:ring-rose-500 focus:border-rose-500 bg-rose-50 p-2.5 resize-none"
                    />
                </div>
                <div>
                    <label htmlFor={`personify-result-${persona.id}`} className="block text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">The Truth (Disarm)</label>
                    <textarea
                        id={`personify-result-${persona.id}`}
                        rows={2}
                        value={editResult}
                        onChange={(e) => setEditResult(e.target.value)}
                        placeholder="How does your True Self respond?"
                        className="w-full text-sm rounded-xl border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 p-2.5 resize-none"
                    />
                </div>
                <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-gray-100">
                    <button onClick={handleCancel} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="Cancel" aria-label="Cancel edit">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                    <button onClick={handleSave} disabled={!editName.trim()} className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm">
                        <CheckIcon className="h-4 w-4" /> Save Rogue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col group hover:shadow-lg transition-shadow">
            {/* Card Header */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserCircleIcon className="h-6 w-6 text-purple-400" />
                    <h3 className="font-black text-white text-lg tracking-tight truncate">{persona.name}</h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors" title="Edit">
                        <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(persona.id)} className="p-1.5 text-gray-400 hover:text-rose-400 rounded-md hover:bg-slate-700 transition-colors" title="Delete">
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
            
            {/* Card Body */}
            <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1">
                {/* The Lie */}
                <div className="bg-rose-50 rounded-xl p-3 sm:p-4 border border-rose-100 flex-1 relative">
                    <div className="flex items-center gap-1.5 mb-2">
                        <ExclamationTriangleIcon className="h-4 w-4 text-rose-600" />
                        <h4 className="text-[10px] font-black text-rose-800 uppercase tracking-widest">The Lie</h4>
                    </div>
                    <p className="text-sm text-rose-900 italic font-medium leading-relaxed">
                        "{persona.action || '...'}"
                    </p>
                </div>

                {/* The Truth */}
                <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 border border-emerald-100 flex-1 relative">
                    <div className="flex items-center gap-1.5 mb-2">
                        <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">The Truth</h4>
                    </div>
                    <p className="text-sm text-emerald-900 font-bold leading-relaxed">
                        {persona.result || '...'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export const PersonifyTool: React.FC = () => { const initialData: PersonifyPayload = { personas: [] };

    const [newName, setNewName] = useState('');
    const [newAction, setNewAction] = useState('');
    const [newResult, setNewResult] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    return (
        <SmartToolContainer<PersonifyPayload>
            toolType="PERSONIFY"
            toolLabel="Personify & Disarm"
            initialData={initialData}
            resumeSession={true} // <--- Added Rehydration Target
        >
            {({ data, updateData }) => {
                
                const handleAddPersona = () => {
                    if (!newName.trim()) return;
                    const newPersona: Persona = {
                        id: Date.now(),
                        name: newName.trim(),
                        action: newAction.trim(),
                        result: newResult.trim()
                    };
                    updateData({ personas: [newPersona, ...data.personas] });
                    setNewName('');
                    setNewAction('');
                    setNewResult('');
                    setIsAdding(false);
                };

                const handleUpdatePersona = (updated: Persona) => { updateData({ personas: data.personas.map(p => p.id === updated.id ? updated : p) });
                };

                const handleDeletePersona = (id: number) => { updateData({ personas: data.personas.filter(p => p.id !== id) });
                };

                return (
                    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
                        
                        {/* Header Explanation */}
                        <div className="bg-purple-50/80 backdrop-blur-md p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 text-purple-900 max-w-2xl">
                                <InformationCircleIcon className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
                                <p className="text-sm sm:text-base leading-relaxed font-medium">
                                    {EXPLANATION}
                                </p>
                            </div>
                            {!isAdding && (
                                <button 
                                    onClick={() => setIsAdding(true)}
                                    className="shrink-0 flex items-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-xl font-bold shadow-md hover:bg-purple-700 hover:shadow-lg transition-all active:scale-95 w-full sm:w-auto justify-center"
                                >
                                    <PlusIcon className="h-5 w-5" /> Identify New Voice
                                </button>
                            )}
                        </div>

                        {/* Add New Form */}
                        {isAdding && (
                            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-purple-200 animate-in fade-in slide-in-from-top-4 duration-300">
                                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <UserCircleIcon className="h-6 w-6 text-purple-500" /> Catalog a New Addictive Voice
                                </h3>
                                <div className="space-y-5">
                                    <div>
                                        <label htmlFor="personify-new-name" className="block text-sm font-bold text-gray-700 mb-1">Rogue's Name</label>
                                        <input
                                            id="personify-new-name"
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="e.g., The Negotiator, The Victim, The Rebel"
                                            className="w-full text-base font-bold rounded-xl border-gray-300 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 p-3"
                                            // eslint-disable-next-line jsx-a11y/no-autofocus -- deliberate: this field only renders when the user clicks "Add New" and is the form's first field, matching WCAG's modal-focus-management guidance (not autofocus on ordinary page load).
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label htmlFor="personify-new-action" className="block text-sm font-bold text-rose-600 mb-1">The Lie It Tells</label>
                                            <textarea
                                                id="personify-new-action"
                                                rows={3}
                                                value={newAction}
                                                onChange={(e) => setNewAction(e.target.value)}
                                                placeholder="e.g., 'You had a hard day, you deserve just one drink to relax.'"
                                                className="w-full text-sm rounded-xl border-rose-200 focus:ring-rose-500 focus:border-rose-500 bg-rose-50 p-3 resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="personify-new-result" className="block text-sm font-bold text-emerald-600 mb-1">The Truth (Disarm)</label>
                                            <textarea
                                                id="personify-new-result"
                                                rows={3}
                                                value={newResult}
                                                onChange={(e) => setNewResult(e.target.value)}
                                                placeholder="e.g., 'A hard day is not an excuse to ruin my tomorrow. I don't drink anymore.'"
                                                className="w-full text-sm rounded-xl border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 p-3 resize-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button 
                                            onClick={() => setIsAdding(false)} 
                                            className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleAddPersona} 
                                            disabled={!newName.trim()} 
                                            className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-md hover:bg-purple-700 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                                        >
                                            <CheckIcon className="h-5 w-5" /> Add to Gallery
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rogue's Gallery Grid */}
                        {data.personas.length === 0 && !isAdding ? (
                            <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
                                <UserCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Gallery is Empty</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Start observing your urges. When a craving hits, give the voice telling you to use a name, and add it here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.personas.map((persona) => (
                                    <PersonaCard 
                                        key={persona.id}
                                        persona={persona}
                                        onUpdate={handleUpdatePersona}
                                        onDelete={handleDeletePersona}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            }}
        </SmartToolContainer>
    );
};
