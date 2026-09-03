import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestoreQuery, useFirestoreMutation } from '../../hooks/useFirestoreCrud';
import { getUserTemplates, saveUserTemplate, deleteUserTemplate, type JournalTemplate } from '../../lib/db';
import { Timestamp } from 'firebase/firestore';
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilSquareIcon, XMarkIcon, ListBulletIcon, HashtagIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import PremiumGate from '../PremiumGate';

// PROJ-108: the /templates route had no tier check at all — JournalEditor's
// entry-point button was gated but the route itself was reachable directly by
// URL for any free user. Gate the component itself, not just its entry point.
export default function TemplateEditor() {
    return (
        <PremiumGate fallbackMode="lock_overlay" customMessage="Unlock custom journal templates.">
            <TemplateEditorContent />
        </PremiumGate>
    );
}

function TemplateEditorContent() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const queryKey = ['templates', user?.uid];
    const { data: templates = [], isLoading: loading } = useFirestoreQuery<JournalTemplate[]>(
        queryKey,
        (uid) => getUserTemplates(uid),
    );
    const saveMutation = useFirestoreMutation<JournalTemplate>(queryKey, {
        mutationFn: (uid, template) => saveUserTemplate(uid, template),
    });
    const deleteMutation = useFirestoreMutation<string>(queryKey, {
        mutationFn: (uid, templateId) => deleteUserTemplate(uid, templateId),
    });

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- Toolbar Helpers ---
    const insertText = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const previousText = textarea.value;
        const selection = previousText.substring(start, end);
        
        const newText = previousText.substring(0, start) + 
                        before + selection + after + 
                        previousText.substring(end);
        
        setContent(newText);
        
        // Reset focus and cursor
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length + selection.length + after.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // --- Tag Helpers ---
    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const clean = tagInput.trim().replace(/^#/, '');
            if (clean && !tags.includes(clean)) {
                setTags([...tags, clean]);
                setTagInput('');
            }
        }
    };

    const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));

    // --- CRUD Operations ---
    const handleEdit = (t: JournalTemplate) => {
        setEditId(t.id);
        setName(t.name);
        // Convert legacy templates to text if needed
        const textContent = t.content || (t.prompts ? t.prompts.map(p => `**${p}**\n\n`).join('') : '');
        setContent(textContent);
        setTags(t.defaultTags || []);
        setIsEditing(true);
    };

    const handleCreate = () => { setEditId(''); setName(''); setContent(''); setTags([]); setIsEditing(true); };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this template?")) return;
        if (!user) return;
        try {
            await deleteMutation.mutateAsync(id);
        } catch (e) {
            console.error("Error deleting", e);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Clean data
        const cleanTags = tags.map(t => t.trim()).filter(t => t !== '').map(t => t.startsWith('#') ? t : `#${t}`);

        if (!name || content.trim() === '') {
            alert("Please provide a name and template content.");
            return;
        }

        try {
            await saveMutation.mutateAsync({
                id: editId || '',
                uid: user.uid,
                name,
                content, // Saving as Free Text
                defaultTags: cleanTags,
                updatedAt: Timestamp.now(),
                ...(editId ? {} : { createdAt: Timestamp.now() }),
            });
            setIsEditing(false);
            resetForm();
        } catch (error) {
            console.error("Error saving template", error);
        }
    };

    const resetForm = () => { setEditId(null); setName(''); setContent(''); setTags([]); };

    if (loading) return <div className="p-8">Loading templates...</div>;

    // --- EDITOR VIEW ---
    if (isEditing) {
        return (
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                
                {/* Header / Nav */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/journal')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {editId ? 'Edit Template' : 'New Free-Text Template'}
                    </h1>
                </div>

                <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                    
                    {/* Name Input */}
                    <div>
                        <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                        <input
                            id="template-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Daily Gratitude List"
                            className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 p-2"
                        />
                    </div>

                    {/* Content Editor */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="template-content" className="block text-sm font-medium text-gray-700">Template Structure</label>
                            <span className="text-xs text-gray-400">Markdown Supported</span>
                        </div>
                        
                        {/* Toolbar */}
                        <div className="flex items-center gap-2 mb-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <button type="button" onClick={() => insertText('### ')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600" title="Heading">
                                <HashtagIcon className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => insertText('**', '**')} className="px-2 py-1 text-sm font-bold hover:bg-white hover:shadow-sm rounded text-gray-600" title="Bold">
                                B
                            </button>
                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                            <button type="button" onClick={() => insertText('- [ ] ')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600" title="Checkbox">
                                <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => insertText('1. ')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600" title="Ordered List">
                                <ListBulletIcon className="h-4 w-4" />
                            </button>
                        </div>

                        <textarea
                            id="template-content"
                            ref={textareaRef}
                            rows={12}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Design your template here using Markdown...&#10;- [ ] Checklist item&#10;**Bold text**"
                            className="w-full font-mono text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 leading-relaxed p-2"
                        />
                    </div>

                    {/* Default Tags */}
                    <div>
                        <label htmlFor="template-tag-input" className="block text-sm font-medium text-gray-700 mb-2">Auto-Tags</label>
                        <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                            {tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-100">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                id="template-tag-input"
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder={tags.length === 0 ? "Add tags (press Enter)..." : ""}
                                className="flex-1 min-w-[150px] text-sm border-none focus:ring-0 p-0 text-gray-700"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button 
                            type="button" 
                            onClick={() => { setIsEditing(false); resetForm(); }}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saveMutation.isPending}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {saveMutation.isPending ? 'Saving...' : 'Save Template'}
                        </button>
                    </div>

                </form>
            </div>
        );
    }

    // --- LIST VIEW ---
    return (
        <div className="max-w-3xl mx-auto space-y-6 p-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/journal')} className="text-gray-500 hover:text-gray-900 lg:hidden">
                   <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Manage Templates</h1>
              </div>
              <button 
                 onClick={handleCreate}
                 className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                 <PlusIcon className="h-5 w-5" />
                 Create New
              </button>
           </div>

           <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
              {templates.length === 0 ? (
                 <div className="p-8 text-center text-gray-500">
                    You haven't created any custom templates yet.
                 </div>
              ) : (
                 <ul className="divide-y divide-gray-100">
                    {templates.map((t) => (
                       <li key={t.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition">
                          <div>
                             <h3 className="font-semibold text-gray-900">{t.name}</h3>
                             <p className="text-sm text-gray-500 mt-1">
                                {t.defaultTags.length > 0 ? t.defaultTags.join(', ') : 'No default tags'}
                             </p>
                          </div>
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={() => handleEdit(t)}
                                className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition"
                                title="Edit"
                             >
                                <PencilSquareIcon className="h-5 w-5" />
                             </button>
                             <button 
                                onClick={() => handleDelete(t.id)}
                                className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition"
                                title="Delete"
                             >
                                <TrashIcon className="h-5 w-5" />
                             </button>
                          </div>
                       </li>
                    ))}
                 </ul>
              )}
           </div>
        </div>
    );
}