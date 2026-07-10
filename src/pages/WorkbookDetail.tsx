import { toast } from 'sonner';
import { useState, useMemo, Fragment } from 'react';
import posthog from 'posthog-js';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getWorkbook, type WorkbookSection } from '../data/workbooks';
import { analyzeWorkbookContent, type WorkbookAnalysisResult } from '../lib/gemini';
import { addTask } from '../lib/tasks';
import { saveInsight } from '../lib/insights';
import { useWorkbookAnswers } from '../hooks/useWorkbookAnswers';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { PlayCircleIcon, CheckCircleIcon, SparklesIcon, ArrowPathIcon, PlusCircleIcon, LightBulbIcon, ShieldExclamationIcon, AcademicCapIcon, BookmarkIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition, RadioGroup } from '@headlessui/react';

export default function WorkbookDetail() {
  const navigate = useNavigate();

  const { workbookId } = useParams();
  const { user } = useAuth();
  const workbook = getWorkbook(workbookId || '');

  // Data: scoped to this workbook (progress + section/workbook-scope analysis)
  const { answers: workbookAnswers, isLoading } = useWorkbookAnswers(workbook?.id);
  // Data: across all workbooks, only needed for the "Global Review" analysis scope
  const { answers: globalAnswers, isLoading: isGlobalLoading } = useWorkbookAnswers();

  const completedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of workbookAnswers) {
        counts[entry.sectionId] = (counts[entry.sectionId] || 0) + 1;
    }
    return counts;
  }, [workbookAnswers]);

  // Analysis State
  const [showWizard, setShowWizard] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisScope, setAnalysisScope] = useState<'section' | 'workbook' | 'global'>('section');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(workbook?.sections[0]?.id || '');
  const [insight, setInsight] = useState<WorkbookAnalysisResult | null>(null);
  const [addedActions, setAddedActions] = useState<Set<string>>(new Set());
  const [savingInsight, setSavingInsight] = useState(false);

  // --- AI ANALYSIS LOGIC ---

  const handleAnalyze = async () => {
    if (!workbook) return;

    posthog.capture('workbook_analysis_requested', {
      workbook_id: workbook.id,
      analysis_scope: analysisScope,
    });

    setAnalyzing(true);
    setInsight(null);
    setAddedActions(new Set());
    setSavingInsight(false);

    try {
        let docsToAnalyze: typeof workbookAnswers = [];
        let contextTitle = "";

        if (analysisScope === 'section') {
            docsToAnalyze = workbookAnswers.filter(a => a.sectionId === selectedSectionId);
            const sec = workbook.sections.find(s => s.id === selectedSectionId);
            contextTitle = sec ? sec.title : "Section Review";
        } else if (analysisScope === 'workbook') {
            docsToAnalyze = workbookAnswers;
            contextTitle = workbook.title;
        } else {
            // Global (already decrypted by useWorkbookAnswers; careful with large datasets in production)
            docsToAnalyze = globalAnswers;
            contextTitle = "Global Recovery Review";
        }

        if (docsToAnalyze.length === 0) { alert("No entries found for this selection. Try completing some questions first."); setAnalyzing(false); return; }

        const textContent = docsToAnalyze.map(d => `Question: ${d.questionId}\nAnswer: ${d.answer}`).join('\n\n');

        // Pass contextTitle to the AI function so it's used
        const result = await analyzeWorkbookContent(contextTitle, [{ question: "Combined Context", answer: textContent }]);

        if (result) { setInsight(result); setShowWizard(false); setShowResult(true); } else {
            alert("Analysis failed. Please try again.");
        }

    } catch (error) { console.error(error); alert("An error occurred during analysis."); } finally {
        setAnalyzing(false);
    }
  };

  const handleSaveLog = async () => {
    if (!user || !insight) return;
    setSavingInsight(true);
    try {
        // Explicitly add 'type: workbook' to match InsightPayload
        await saveInsight(user.uid, { type: 'workbook', ...insight });
        setSavingInsight(false); 
        setShowResult(false);
        alert("Insight successfully saved to your Wisdom Log!");
    } catch (error) { console.error("Failed to save log", error); setSavingInsight(false); alert("Failed to save. Please try again."); }
  };

  const handleAddToHabits = async (action: string, actionIndex: number) => {
    if (!user) return;
    try {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);
        const sourceContext = insight?.action_contexts?.[actionIndex];
        await addTask(
          user.uid,
          action,
          { type: 'once' },
          'High',
          dueDate,
          'ai',
          {
            sourceContext,
            sourceRef: workbookId ? `workbook:${workbookId}` : undefined,
          }
        );
        setAddedActions(prev => new Set(prev).add(action));
      toast.success('Task added to your ledger.', { action: { label: 'View Tasks', onClick: () => navigate('/tasks') } });
    } catch (e) {
        console.error(e);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading workbook...</div>;
  if (!workbook) return <div className="p-8 text-center text-gray-500">Workbook not found.</div>;

  // Calculate mastery for header
  const totalWorkbookQuestions = workbook.sections.reduce((acc, sec) => acc + sec.questions.filter(q => q.type !== 'read_only').length, 0);
  const totalAnswered = Object.values(completedCounts).reduce((a, b) => a + b, 0);
  const mastery = totalWorkbookQuestions > 0 ? Math.round((totalAnswered / totalWorkbookQuestions) * 100) : 0;

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.workbooks.page}`}>
      
      {/* 1. FIXED HEADER */}
      <div className="flex-shrink-0 z-10">
        <VibrantHeader 
            title={workbook.title}
            subtitle="Guided Recovery Journey"
            icon={BookOpenIcon}
            fromColor={THEME.workbooks.header.from}
            viaColor={THEME.workbooks.header.via}
            toColor={THEME.workbooks.header.to}
            percentage={mastery}
            percentageColor={THEME.workbooks.ring}
            backLink="/workbooks"
        />
      </div>

      {/* 2. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-24">
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 text-sm text-emerald-900 mb-6">
              {workbook.description}
          </div>

          {workbook.sections.map((section: WorkbookSection) => {
              const answeredCount = completedCounts[section.id] || 0;
              const totalQuestions = section.questions.filter(q => q.type !== 'read_only').length;
              const isComplete = totalQuestions > 0 && answeredCount >= totalQuestions;
              const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

              return (
                  <div key={section.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-300 transition-all group">
                      <div className="flex items-center justify-between">
                          <div className="flex-1">
                             <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                  {section.title}
                                  {isComplete && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                             </h3>
                              <p className="text-sm text-gray-500 line-clamp-1">{section.description}</p>
                              
                             <div className="mt-3 w-full max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${progressPercent}%` }} />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{answeredCount} / {totalQuestions} completed</p>
                          </div>

                          <button 
                             onClick={() => navigate(`/workbooks/${workbook.id}/session/${section.id}`)}
                             className={`p-3 rounded-full transition-all ${isComplete ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                          >
                              {isComplete ? <ArrowPathIcon className="h-6 w-6" /> : <PlayCircleIcon className="h-6 w-6" />}
                          </button>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* FAB: Consult Compass */}
      <button
        onClick={() => setShowWizard(true)}
        className="fixed bottom-6 right-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-full shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all z-30 flex items-center gap-2 group"
      >
        <SparklesIcon className="h-6 w-6 group-hover:animate-pulse" />
        <span className="hidden group-hover:inline text-sm font-bold pr-1">Consult Compass</span>
      </button>

      {/* --- WIZARD MODAL (Scope Selection) --- */}
      <Transition appear show={showWizard} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowWizard(false)}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
               <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <SparklesIcon className="h-6 w-6 text-purple-600" />
                  Ask the Recovery Compass
              </Dialog.Title>

              <div className="space-y-4">
                   <RadioGroup value={analysisScope} onChange={setAnalysisScope} className="space-y-3">
                      <RadioGroup.Option value="section" className={({ checked }) => `relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none ${checked ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200'}`}>
                          {({ checked }) => (
                              <div className="flex w-full items-center justify-between">
                                   <div className="text-sm">
                                      <RadioGroup.Label as="p" className={`font-medium ${checked ? 'text-white' : 'text-gray-900'}`}>Specific Section</RadioGroup.Label>
                                  </div>
                                   {checked && <CheckCircleIcon className="h-6 w-6 text-white" />}
                              </div>
                          )}
                      </RadioGroup.Option>

                      {analysisScope === 'section' && (
                          <div className="ml-4 pl-4 border-l-2 border-gray-100">
                              <select value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} className="w-full text-sm border-gray-300 rounded-lg">
                                   {workbook.sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                              </select>
                          </div>
                      )}

                      <RadioGroup.Option value="workbook" className={({ checked }) => `relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none ${checked ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200'}`}>
                          {({ checked }) => (
                              <div className="flex w-full items-center justify-between">
                                   <div className="text-sm">
                                      <RadioGroup.Label as="p" className={`font-medium ${checked ? 'text-white' : 'text-gray-900'}`}>Full Workbook</RadioGroup.Label>
                                  </div>
                                   {checked && <CheckCircleIcon className="h-6 w-6 text-white" />}
                              </div>
                          )}
                      </RadioGroup.Option>

                      <RadioGroup.Option value="global" className={({ checked }) => `relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none ${checked ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200'}`}>
                          {({ checked }) => (
                              <div className="flex w-full items-center justify-between">
                                   <div className="text-sm">
                                      <RadioGroup.Label as="p" className={`font-medium ${checked ? 'text-white' : 'text-gray-900'}`}>Global Review</RadioGroup.Label>
                                  </div>
                                   {checked && <CheckCircleIcon className="h-6 w-6 text-white" />}
                              </div>
                          )}
                      </RadioGroup.Option>
                  </RadioGroup>

                  <div className="mt-6 flex justify-end gap-3">
                      <button onClick={() => setShowWizard(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
                      <button onClick={handleAnalyze} disabled={analyzing || (analysisScope === 'global' && isGlobalLoading)} className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                          {analyzing ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
                          Analyze Now
                      </button>
                  </div>
              </div>
          </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* --- RESULT MODAL --- */}
      <Transition appear show={showResult} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowResult(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="fixed inset-0 overflow-y-auto">
            
             <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  {insight && (
                      <div className="space-y-6">
                          <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                  <SparklesIcon className="h-6 w-6 text-purple-600" />
                                  {insight.scope_context}
                              </h2>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                              <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Summary</h5>
                              <p className="text-sm text-gray-700 leading-relaxed">{insight.summary}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                  <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-xs uppercase tracking-wide">
                                       <AcademicCapIcon className="h-4 w-4" /> Understanding
                                  </div>
                                  <p className="text-sm text-blue-900 leading-relaxed">{insight.pillars.understanding}</p>
                              </div>
                              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                  <div className="flex items-center gap-2 mb-2 text-orange-800 font-bold text-xs uppercase tracking-wide">
                                       <ShieldExclamationIcon className="h-4 w-4" /> Blind Spots
                                  </div>
                                   <p className="text-sm text-orange-900 leading-relaxed">{insight.pillars.blind_spots}</p>
                              </div>
                              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                  <div className="flex items-center gap-2 mb-2 text-green-800 font-bold text-xs uppercase tracking-wide">
                                      <LightBulbIcon className="h-4 w-4" /> Growth
                                  </div>
                                   <p className="text-sm text-green-900 leading-relaxed">{insight.pillars.emotional_resonance}</p>
                              </div>
                          </div>

                          <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                              <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                  <CheckCircleIcon className="h-5 w-5" /> Suggested Action Steps
                              </h3>
                              <ul className="space-y-2">
                                  {insight.suggested_actions.map((action, idx) => {
                                       const isAdded = addedActions.has(action);
                                       return (
                                          <li key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                                              <span className="text-sm text-gray-700 font-medium">{action}</span>
                                              <button
                                                  onClick={() => !isAdded && handleAddToHabits(action, idx)}
                                                  disabled={isAdded}
                                                  className={`p-1.5 rounded-full transition-all ${isAdded ? 'text-green-500 bg-green-50' : 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'}`}
                                              >
                                                  {isAdded ? <CheckCircleIcon className="h-6 w-6" /> : <PlusCircleIcon className="h-6 w-6" />}
                                              </button>
                                          </li>
                                       );
                                  })}
                              </ul>
                          </div>

                          <div className="mt-6 flex justify-between pt-4 border-t border-gray-100">
                                {/* LEFT: SAVE LOG */}
                                <button 
                                    type="button" 
                                    disabled={savingInsight}
                                    onClick={handleSaveLog}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                >
                                    <BookmarkIcon className="h-4 w-4" />
                                    {savingInsight ? "Saving..." : "Save to Wisdom Log"}
                                </button>

                                {/* RIGHT: CLOSE */}
                                <button type="button" className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors" onClick={() => setShowResult(false)}>
                                    Close
                                </button>
                          </div>
                      </div>
                  )}
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

    </div>
  );
}
