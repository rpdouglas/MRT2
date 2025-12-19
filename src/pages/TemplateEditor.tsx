import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserTemplates,
  saveUserTemplate, 
  deleteUserTemplate, 
  type JournalTemplate 
} from '../lib/db';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilSquareIcon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function TemplateEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState<JournalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [name, setName] = useState('');
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [tags, setTags] = useState(''); // Comma separated string for input

  useEffect(() => {
    loadTemplates();
  }, [user]);

  async function loadTemplates() {
    if (!user) return;
    const data = await getUserTemplates(user.uid);
    setTemplates(data);
    setLoading(false);
  }

  const handleEdit = (t: JournalTemplate) => {
    setCurrentId(t.id);
    setName(t.name);
    setPrompts(t.prompts.length > 0 ? t.prompts : ['']);
    setTags(t.defaultTags.join(', '));
    setIsEditing(true);
  };

  const handleCreate = () => {
    setCurrentId('');
    setName('');
    setPrompts(['']);
    setTags('');
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm("Are you sure you want to delete this template?")) return;
    await deleteUserTemplate(user.uid, id);
    await loadTemplates();
  };

  const handlePromptChange = (idx: number, val: string) => {
    const newPrompts = [...prompts];
    newPrompts[idx] = val;
    setPrompts(newPrompts);
  };

  const addPromptLine = () => {
    setPrompts([...prompts, '']);
  };

  const removePromptLine = (idx: number) => {
    const newPrompts = prompts.filter((_, i) => i !== idx);
    setPrompts(newPrompts);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Clean data
    const cleanPrompts = prompts.filter(p => p.trim() !== '');
    const cleanTags = tags.split(',').map(t => t.trim()).filter(t => t !== '').map(t => t.startsWith('#') ? t : `#${t}`);

    if (!name || cleanPrompts.length === 0) {
        alert("Please provide a name and at least one prompt.");
        return;
    }

    const templateData: JournalTemplate = {
        id: currentId, // empty string means new doc
        name,
        prompts: cleanPrompts,
        defaultTags: cleanTags
    };

    await saveUserTemplate(user.uid, templateData);
    setIsEditing(false);
    await loadTemplates();
  };

  if (loading) return <div className="p-8">Loading templates...</div>;

  // --- EDITOR VIEW ---
  if (isEditing) {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-900">
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{currentId ? 'Edit Template' : 'New Template'}</h1>
            </div>

            <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Step 10 Inventory"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prompts (Questions)</label>
                    <div className="space-y-3">
                        {prompts.map((p, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={p}
                                    onChange={(e) => handlePromptChange(idx, e.target.value)}
                                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`Question ${idx + 1}`}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => removePromptLine(idx)}
                                    className="text-red-400 hover:text-red-600 p-2"
                                    title="Remove prompt"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button 
                        type="button"
                        onClick={addPromptLine}
                        className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Question
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Tags</label>
                    <input 
                        type="text" 
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="#step10, #inventory (comma separated)"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button 
                        type="button" 
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        Save Template
                    </button>
                </div>
            </form>
        </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
                         <p className="text-sm text-gray-500 mt-1">{t.prompts.length} questions • {t.defaultTags.join(', ')}</p>
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