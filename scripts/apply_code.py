import os

# Define fence to protect markdown backticks
FENCE = "```"

# =============================================================================
# src/components/admin/FeedbackViewer.tsx
# =============================================================================
feedback_viewer_content = r'''import React, { useState, useEffect, useMemo, type ElementType } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Disclosure, Transition } from '@headlessui/react';
import { 
    Clock, 
    ExternalLink, 
    Github, 
    ClipboardList,
    ChevronUpIcon,
    InboxIcon,
    Search,     // WAS: MagnifyingGlassIcon
    Archive     // WAS: ArchiveBoxIcon
} from 'lucide-react';

interface FeedbackReport {
  id: string;
  category: 'bug' | 'suggestion' | 'content';
  message: string;
  status: 'new' | 'investigating' | 'resolved';
  buildHash: string;
  environment: string;
  vaultUnlocked: boolean;
  route: string;
  userAgent: string;
  timestamp?: Timestamp;
}

interface SectionHeaderProps {
  title: string;
  count: number;
  color: string;
  icon: ElementType;
  isOpen: boolean;
}

const FeedbackViewer: React.FC = () => {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    if (!db) {
        setTimeout(() => setLoading(false), 0);
        return;
    }

    // Fetch all feedback, order by newest first
    const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(d => {
            const raw = d.data();
            return {
                id: d.id,
                ...raw,
                message: raw.message || raw.content || '',
                // Ensure status has a default if missing
                status: raw.status || 'new'
            } as FeedbackReport;
        });
        setReports(data);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to listen to feedback:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // --- 2. GROUPING LOGIC ---
  const groupedReports = useMemo(() => {
      return {
          new: reports.filter(r => r.status === 'new'),
          investigating: reports.filter(r => r.status === 'investigating'),
          resolved: reports.filter(r => r.status === 'resolved')
      };
  }, [reports]);

  // --- 3. ACTIONS ---
  const updateStatus = async (id: string, newStatus: FeedbackReport['status']) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'feedback', id), { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const sendToGitHub = (report: FeedbackReport) => {
    const repoUrl = "[https://github.com/rpdouglas/MRT2/issues/new](https://github.com/rpdouglas/MRT2/issues/new)";
    const title = encodeURIComponent(`[${report.category?.toUpperCase() || 'BUG'}] Issue reported on ${report.route || 'unknown'}`);
    
    const bodyMarkdown = `
### User Report
${report.message || 'No content provided.'}

---
### Technical Context
* **Route:** \`${report.route || 'N/A'}\`
* **Environment:** \`${report.environment || 'N/A'}\`
* **Build Hash:** \`${report.buildHash || 'N/A'}\`
* **Vault Unlocked:** \`${report.vaultUnlocked}\`
* **Device/Browser:** \`${report.userAgent || 'N/A'}\`
* **Firestore ID:** \`${report.id}\`
    `.trim();

    const body = encodeURIComponent(bodyMarkdown);
    window.open(`${repoUrl}?title=${title}&body=${body}`, '_blank');
  };

  const generateTriageReport = () => {
    const investigating = groupedReports.investigating;
    
    if (investigating.length === 0) {
      alert("You have no bugs tagged as 'investigating'. Tag some first!");
      return;
    }

    // Group by Route
    const groupedByRoute = investigating.reduce((acc, report) => {
      const route = report.route || 'Global/Unknown';
      if (!acc[route]) acc[route] = [];
      acc[route].push(report);
      return acc;
    }, {} as Record<string, FeedbackReport[]>);

    let markdown = `# 🐛 Bug Bash: Active Triage Report\n`;
    markdown += `**Generated:** ${new Date().toLocaleDateString()}\n`;
    markdown += `**Total Issues:** ${investigating.length}\n\n`;

    Object.entries(groupedByRoute).forEach(([route, bugs], index) => {
      markdown += `## Phase ${index + 1}: ${route} Polish\n`;
      bugs.forEach(bug => {
        const dateStr = bug.timestamp?.toDate ? bug.timestamp.toDate().toLocaleDateString() : 'Unknown Date';
        markdown += `- [ ] **[${bug.category?.toUpperCase() || 'BUG'}]** ${bug.message.split('\n')[0]}\n`;
        markdown += `  - *Details:* \`${bug.environment}\` | Vault Unlocked: \`${bug.vaultUnlocked}\` | Reported: ${dateStr}\n`;
      });
      markdown += `\n`;
    });

    navigator.clipboard.writeText(markdown).then(() => {
      alert("✅ Triage Report copied!");
    });
  };

  if (loading) return <div className="p-4 text-slate-400">Loading inbox...</div>;

  // --- 4. RENDER HELPERS ---
  const SectionHeader = ({ title, count, color, icon: Icon, isOpen }: SectionHeaderProps) => (
      <div className={`flex items-center justify-between w-full px-4 py-3 text-left text-sm font-bold rounded-xl transition-all ${
          isOpen ? `bg-${color}-50 text-${color}-900` : 'bg-white text-slate-500 hover:bg-slate-50'
      }`}>
          <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isOpen ? `bg-${color}-100` : 'bg-slate-100'}`}>
                  <Icon className="w-4 h-4" />
              </div>
              <span>{title}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isOpen ? `bg-${color}-200 text-${color}-800` : 'bg-slate-200 text-slate-600'}`}>
                  {count}
              </span>
          </div>
          <ChevronUpIcon className={`${isOpen ? 'transform rotate-180' : ''} w-5 h-5 text-slate-400 transition-transform`} />
      </div>
  );

  const ReportCard = ({ report }: { report: FeedbackReport }) => (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
          <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${
                      report.category === 'bug' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                      report.category === 'suggestion' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      'bg-slate-50 text-slate-700 border-slate-100'
                  }`}>
                      {report.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString() : 'N/A'}
                  </span>
              </div>
              
              {/* Quick Status Actions */}
              <select 
                  value={report.status}
                  onChange={(e) => updateStatus(report.id, e.target.value as FeedbackReport['status'])}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
              >
                  <option value="new">New</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
              </select>
          </div>

          <p className="text-sm text-slate-800 mb-3 whitespace-pre-wrap leading-relaxed">{report.message}</p>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-[10px] font-mono text-slate-400">
                  {report.route || '/'} • {report.environment}
              </div>
              <button 
                  onClick={() => sendToGitHub(report)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                  title="Create GitHub Issue"
              >
                  <Github className="w-3 h-3" />
                  <span>Issue</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
              </button>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      
      {/* ACTION BAR */}
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl shadow-lg shrink-0">
        <div>
          <h3 className="text-white font-bold flex items-center gap-2">
              <InboxIcon className="w-5 h-5 text-blue-400" />
              Feedback Inbox
          </h3>
          <p className="text-xs text-slate-400">Manage incoming reports.</p>
        </div>
        <button 
          onClick={generateTriageReport}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-50 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md"
        >
          <ClipboardList className="w-4 h-4" />
          Triage Report
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* SECTION 1: NEW ISSUES (Default Open) */}
          <Disclosure defaultOpen>
              {({ open }) => (
                  <div className={`rounded-2xl transition-all ${open ? 'bg-blue-50/50 p-2' : ''}`}>
                      <Disclosure.Button className="w-full focus:outline-none mb-2">
                          <SectionHeader title="New Issues" count={groupedReports.new.length} color="blue" icon={InboxIcon} isOpen={open} />
                      </Disclosure.Button>
                      <Transition
                          enter="transition duration-100 ease-out"
                          enterFrom="transform scale-95 opacity-0"
                          enterTo="transform scale-100 opacity-100"
                          leave="transition duration-75 ease-out"
                          leaveFrom="transform scale-100 opacity-100"
                          leaveTo="transform scale-95 opacity-0"
                      >
                          <Disclosure.Panel className="space-y-3 px-1 pb-2">
                              {groupedReports.new.length === 0 ? (
                                  <div className="text-center py-6 text-slate-400 text-sm italic">Inbox Zero! No new reports.</div>
                              ) : (
                                  groupedReports.new.map(report => <ReportCard key={report.id} report={report} />)
                              )}
                          </Disclosure.Panel>
                      </Transition>
                  </div>
              )}
          </Disclosure>

          {/* SECTION 2: INVESTIGATING (Default Open) */}
          <Disclosure defaultOpen>
              {({ open }) => (
                  <div className={`rounded-2xl transition-all ${open ? 'bg-amber-50/50 p-2' : ''}`}>
                      <Disclosure.Button className="w-full focus:outline-none mb-2">
                          <SectionHeader title="Investigating" count={groupedReports.investigating.length} color="amber" icon={Search} isOpen={open} />
                      </Disclosure.Button>
                      <Transition
                          enter="transition duration-100 ease-out"
                          enterFrom="transform scale-95 opacity-0"
                          enterTo="transform scale-100 opacity-100"
                          leave="transition duration-75 ease-out"
                          leaveFrom="transform scale-100 opacity-100"
                          leaveTo="transform scale-95 opacity-0"
                      >
                          <Disclosure.Panel className="space-y-3 px-1 pb-2">
                               {groupedReports.investigating.length === 0 ? (
                                  <div className="text-center py-4 text-slate-400 text-sm italic">No active investigations.</div>
                              ) : (
                                  groupedReports.investigating.map(report => <ReportCard key={report.id} report={report} />)
                              )}
                          </Disclosure.Panel>
                      </Transition>
                  </div>
              )}
          </Disclosure>

          {/* SECTION 3: RESOLVED (Default Closed) */}
          <Disclosure>
              {({ open }) => (
                  <div className={`rounded-2xl transition-all ${open ? 'bg-slate-100 p-2' : ''}`}>
                      <Disclosure.Button className="w-full focus:outline-none mb-2">
                          <SectionHeader title="Resolved / Archive" count={groupedReports.resolved.length} color="slate" icon={Archive} isOpen={open} />
                      </Disclosure.Button>
                      <Transition
                          enter="transition duration-100 ease-out"
                          enterFrom="transform scale-95 opacity-0"
                          enterTo="transform scale-100 opacity-100"
                          leave="transition duration-75 ease-out"
                          leaveFrom="transform scale-100 opacity-100"
                          leaveTo="transform scale-95 opacity-0"
                      >
                          <Disclosure.Panel className="space-y-3 px-1 pb-2">
                              {groupedReports.resolved.map(report => (
                                  <div key={report.id} className="opacity-75 hover:opacity-100 transition-opacity">
                                      <ReportCard report={report} />
                                  </div>
                              ))}
                          </Disclosure.Panel>
                      </Transition>
                  </div>
              )}
          </Disclosure>
          
      </div>
    </div>
  );
};

export default FeedbackViewer;
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    # Replace the placeholder with actual backticks
    final_content = content.replace("__FENCE__", FENCE).strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated Feature: {path}")

if __name__ == "__main__":
    write_file("src/components/admin/FeedbackViewer.tsx", feedback_viewer_content)
    print("✨ SRE Fix complete: Replaced invalid Heroicons with Lucide equivalents.")