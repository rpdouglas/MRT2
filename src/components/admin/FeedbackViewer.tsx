import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AlertCircle, CheckCircle, Clock, ExternalLink, Github, ClipboardList } from 'lucide-react';

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

const FeedbackViewer: React.FC = () => {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
        setTimeout(() => setLoading(false), 0);
        return;
    }

    const q = query(collection(db, 'feedback'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(d => {
            const raw = d.data();
            return {
                id: d.id,
                ...raw,
                message: raw.message || raw.content || '',
                timestamp: raw.timestamp || raw.createdAt || null
            } as FeedbackReport;
        });
        
        data.sort((a, b) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
            return timeB - timeA;
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

  const updateStatus = async (id: string, newStatus: FeedbackReport['status']) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'feedback', id), { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const sendToGitHub = (report: FeedbackReport) => {
    const repoUrl = "https://github.com/rpdouglas/MRT2/issues/new";
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

  // --- NEW: THE AUTOMATED TRIAGE REPORT GENERATOR ---
  const generateTriageReport = () => {
    const investigating = reports.filter(r => r.status === 'investigating');
    
    if (investigating.length === 0) {
      alert("You have no bugs tagged as 'investigating'. Tag some first!");
      return;
    }

    // Group the bugs by their application route
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

    // Copy to clipboard
    navigator.clipboard.writeText(markdown).then(() => {
      alert("✅ Triage Report copied to your clipboard! Paste it into GitHub or your Sprint Board.");
    }).catch(err => {
      console.error("Failed to copy", err);
      alert("Failed to copy to clipboard. Check the console.");
    });
  };

  if (loading) return <div className="p-4 text-slate-400">Loading inbox...</div>;

  return (
    <div className="space-y-4">
      {/* ACTION BAR */}
      <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700">
        <div>
          <h3 className="text-white font-bold">Feedback Inbox</h3>
          <p className="text-xs text-slate-400">Manage user reports and feature requests.</p>
        </div>
        <button 
          onClick={generateTriageReport}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
        >
          <ClipboardList className="w-4 h-4" />
          Generate Triage Report
        </button>
      </div>

      {reports.map(report => (
        <div key={report.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {report.category === 'bug' ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              )}
              <span className="text-sm font-medium text-slate-200 uppercase tracking-wider">
                {report.category || 'unknown'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                report.status === 'new' ? 'bg-blue-500/20 text-blue-300' :
                report.status === 'investigating' ? 'bg-amber-500/20 text-amber-300' :
                'bg-emerald-500/20 text-emerald-300'
              }`}>
                {report.status || 'new'}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString() : 'No date'}
            </div>
          </div>

          <p className="text-slate-300 mb-4 whitespace-pre-wrap">{report.message || 'No content.'}</p>

          <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-400 font-mono mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div>Route: <span className="text-slate-300">{report.route || 'N/A'}</span></div>
              <div>Env: <span className="text-slate-300">{report.environment || 'N/A'}</span></div>
              <div>Build: <span className="text-slate-300">{report.buildHash || 'N/A'}</span></div>
              <div>Vault: <span className="text-slate-300">{report.vaultUnlocked ? 'Unlocked' : 'Locked'}</span></div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-700/50 pt-3">
            <select
              value={report.status || 'new'}
              onChange={(e) => updateStatus(report.id, e.target.value as FeedbackReport['status'])}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded px-2 py-1 outline-none focus:border-cyan-500"
            >
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>

            <button 
              onClick={() => sendToGitHub(report)}
              className="ml-auto flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
            >
              <Github className="w-3 h-3" />
              Send to GitHub
              <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
            </button>
          </div>
        </div>
      ))}
      
      {reports.length === 0 && (
        <div className="text-center text-slate-500 py-8">
          Inbox is empty. Everything is running smoothly!
        </div>
      )}
    </div>
  );
};

export default FeedbackViewer;
