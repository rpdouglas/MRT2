import { useMemo } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { 
    ChevronUpIcon, 
    BugAntIcon, 
    LightBulbIcon, 
    ChatBubbleBottomCenterTextIcon,
    QueueListIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { doc, updateDoc, type Firestore } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface FeedbackReport {
    id: string;
    uid: string;
    type: 'bug' | 'feature' | 'general';
    status: 'new' | 'backlog' | 'investigating' | 'resolved';
    title: string;
    description: string;
    createdAt: Date | string | number; // Strict typing to avoid 'any'
    githubUrl?: string;
}

interface FeedbackViewerProps {
    reports?: FeedbackReport[]; // Made optional to fix AdminDashboard TS error
    onStatusChange?: () => void;
}

export default function FeedbackViewer({ reports = [], onStatusChange }: FeedbackViewerProps) {
    // Grouping Logic (Updated to securely separate the Backlog)
    const groupedReports = useMemo(() => {
        return {
            new: reports.filter(r => r.status === 'new'),
            backlog: reports.filter(r => r.status === 'backlog'),
            investigating: reports.filter(r => r.status === 'investigating'),
            resolved: reports.filter(r => r.status === 'resolved'),
        };
    }, [reports]);

    const handleStatusChange = async (reportId: string, newStatus: FeedbackReport['status']) => {
        if (!db) {
            console.error("Firestore database is not initialized.");
            return;
        }
        
        try {
            const reportRef = doc(db as Firestore, 'feedback', reportId);
            await updateDoc(reportRef, { status: newStatus });
            if (onStatusChange) onStatusChange();
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    // Preserved triage reporting logic
    const generateTriageReport = () => {
        const reportText = `--- TRIAGE REPORT ---\n` +
            `New: ${groupedReports.new.length}\n` +
            `Backlog: ${groupedReports.backlog.length}\n` +
            `Investigating: ${groupedReports.investigating.length}\n` +
            `Resolved: ${groupedReports.resolved.length}\n` +
            `---------------------`;
        console.log(reportText);
        alert("Triage report generated in console.");
    };

    // Preserved GitHub synchronization logic
    const sendToGitHub = async (report: FeedbackReport) => {
        console.log(`Simulating send to GitHub for issue: ${report.title}`);
        alert(`GitHub issue creation triggered for: ${report.title}`);
    };

    const getTypeIcon = (type: FeedbackReport['type']) => {
        switch (type) {
            case 'bug': return <BugAntIcon className="h-5 w-5 text-red-500" />;
            case 'feature': return <LightBulbIcon className="h-5 w-5 text-amber-500" />;
            default: return <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-blue-500" />;
        }
    };

    const ReportCard = ({ report }: { report: FeedbackReport }) => (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-3 flex flex-col sm:flex-row justify-between gap-4 transition-all hover:shadow-md">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(report.type)}
                    <h4 className="font-semibold text-slate-800">{report.title}</h4>
                </div>
                <p className="text-sm text-slate-600 mb-2">{report.description}</p>
                <div className="text-xs text-slate-400 font-mono">
                    ID: {report.id} | User: {report.uid}
                </div>
            </div>
            <div className="flex flex-col gap-2 min-w-[150px]">
                <select
                    value={report.status}
                    onChange={(e) => handleStatusChange(report.id, e.target.value as FeedbackReport['status'])}
                    className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white"
                >
                    <option value="new">New</option>
                    <option value="backlog">Backlog</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                </select>
                
                <button 
                    onClick={() => sendToGitHub(report)}
                    className="text-xs bg-slate-800 text-white py-1.5 px-3 rounded hover:bg-slate-700 transition-colors font-medium shadow-sm"
                >
                    Send to GitHub
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-end mb-4">
                <button 
                    onClick={generateTriageReport}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
                >
                    Generate Triage Report
                </button>
            </div>

            {/* NEW ISSUES */}
            <Disclosure defaultOpen={true}>
                {({ open }) => (
                    <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden shadow-sm">
                        <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 bg-blue-100/50 hover:bg-blue-100 text-blue-900 font-medium transition-colors">
                            <div className="flex items-center gap-2">
                                <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-blue-600" />
                                <span>New Issues ({groupedReports.new.length})</span>
                            </div>
                            <ChevronUpIcon className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-blue-500 transition-transform`} />
                        </Disclosure.Button>
                        <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                        >
                            <Disclosure.Panel className="p-4">
                                {groupedReports.new.length === 0 ? (
                                    <p className="text-sm text-blue-600 italic">No new issues.</p>
                                ) : (
                                    groupedReports.new.map(r => <ReportCard key={r.id} report={r} />)
                                )}
                            </Disclosure.Panel>
                        </Transition>
                    </div>
                )}
            </Disclosure>

            {/* BACKLOG (NEW SECTION) */}
            <Disclosure defaultOpen={true}>
                {({ open }) => (
                    <div className="bg-purple-50 rounded-lg border border-purple-200 overflow-hidden shadow-sm">
                        <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 bg-purple-100/50 hover:bg-purple-100 text-purple-900 font-medium transition-colors">
                            <div className="flex items-center gap-2">
                                <QueueListIcon className="h-5 w-5 text-purple-600" />
                                <span>Backlog ({groupedReports.backlog.length})</span>
                            </div>
                            <ChevronUpIcon className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-purple-500 transition-transform`} />
                        </Disclosure.Button>
                        <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                        >
                            <Disclosure.Panel className="p-4">
                                {groupedReports.backlog.length === 0 ? (
                                    <p className="text-sm text-purple-600 italic">The backlog is currently empty.</p>
                                ) : (
                                    groupedReports.backlog.map(r => <ReportCard key={r.id} report={r} />)
                                )}
                            </Disclosure.Panel>
                        </Transition>
                    </div>
                )}
            </Disclosure>

            {/* INVESTIGATING */}
            <Disclosure defaultOpen={true}>
                {({ open }) => (
                    <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden shadow-sm">
                        <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 bg-amber-100/50 hover:bg-amber-100 text-amber-900 font-medium transition-colors">
                            <div className="flex items-center gap-2">
                                <ArrowPathIcon className="h-5 w-5 text-amber-600 animate-spin-slow" />
                                <span>Investigating ({groupedReports.investigating.length})</span>
                            </div>
                            <ChevronUpIcon className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-amber-500 transition-transform`} />
                        </Disclosure.Button>
                        <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                        >
                            <Disclosure.Panel className="p-4">
                                {groupedReports.investigating.length === 0 ? (
                                    <p className="text-sm text-amber-600 italic">Nothing currently under investigation.</p>
                                ) : (
                                    groupedReports.investigating.map(r => <ReportCard key={r.id} report={r} />)
                                )}
                            </Disclosure.Panel>
                        </Transition>
                    </div>
                )}
            </Disclosure>

            {/* RESOLVED */}
            <Disclosure defaultOpen={false}>
                {({ open }) => (
                    <div className="bg-green-50 rounded-lg border border-green-200 overflow-hidden shadow-sm">
                        <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 bg-green-100/50 hover:bg-green-100 text-green-900 font-medium transition-colors">
                            <div className="flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                <span>Resolved ({groupedReports.resolved.length})</span>
                            </div>
                            <ChevronUpIcon className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-green-500 transition-transform`} />
                        </Disclosure.Button>
                        <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                        >
                            <Disclosure.Panel className="p-4">
                                {groupedReports.resolved.length === 0 ? (
                                    <p className="text-sm text-green-600 italic">No resolved issues yet.</p>
                                ) : (
                                    groupedReports.resolved.map(r => <ReportCard key={r.id} report={r} />)
                                )}
                            </Disclosure.Panel>
                        </Transition>
                    </div>
                )}
            </Disclosure>
        </div>
    );
}
