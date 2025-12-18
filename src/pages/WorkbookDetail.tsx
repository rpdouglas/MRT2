import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// REMOVED 'WORKBOOKS' from import
import { getWorkbook } from '../data/workbooks';
import { getSectionCompletion } from '../lib/workbooks';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRightIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function WorkbookDetail() {
  const { workbookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const workbook = getWorkbook(workbookId || '');
  
  const [progressMap, setProgressMap] = useState<{[sectionId: string]: number}>({});
  // REMOVED 'loading' state as we render conditionally on workbook existence

  useEffect(() => {
    async function loadProgress() {
      if (!user || !workbook) return;
      
      const newMap: {[key: string]: number} = {};
      
      for (const section of workbook.sections) {
        const pct = await getSectionCompletion(user.uid, workbook.id, section.id, section.questions.length);
        newMap[section.id] = pct;
      }
      
      setProgressMap(newMap);
    }

    loadProgress();
  }, [user, workbook]);

  if (!workbook) return <div>Workbook not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/workbooks')} className="text-gray-500 hover:text-gray-900">
           <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{workbook.title}</h1>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {workbook.sections.map((section) => {
            const progress = progressMap[section.id] || 0;
            const isComplete = progress === 100;
            // REMOVED 'isStarted' variable

            return (
              <li key={section.id}>
                <Link 
                  to={`/workbooks/${workbook.id}/session/${section.id}`}
                  className="block hover:bg-gray-50 transition p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        {isComplete && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-500">{section.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="mt-2 w-full max-w-[200px] bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`} 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                      <span className="text-xs text-gray-400 mt-1 block">{progress}% Complete</span>
                    </div>
                    
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}