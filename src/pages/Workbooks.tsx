    import { Link } from 'react-router-dom';
import { WORKBOOKS } from '../data/workbooks';
import { BookOpenIcon, StarIcon, HeartIcon } from '@heroicons/react/24/outline';

export default function Workbooks() {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'general': return <StarIcon className="h-6 w-6 text-yellow-500" />;
      case 'steps': return <BookOpenIcon className="h-6 w-6 text-blue-500" />;
      default: return <HeartIcon className="h-6 w-6 text-purple-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-2xl font-bold leading-6 text-gray-900">Recovery Workbooks</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Structured guides to help you process your journey. Select a workbook to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {WORKBOOKS.map((workbook) => (
          <div key={workbook.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                {getIcon(workbook.type)}
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{workbook.title}</h4>
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {workbook.sections.length} Sections
                </span>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm flex-grow mb-6">
              {workbook.description}
            </p>

            <Link 
              to={`/workbooks/${workbook.id}`}
              className="w-full bg-blue-600 text-white text-center py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Workbook
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}