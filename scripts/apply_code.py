import os

feedback_viewer_code = r'''import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AlertCircle, CheckCircle, Clock, ExternalLink, Github } from 'lucide-react';

interface FeedbackReport {
  id: string;
  category: 'bug' | 'suggestion' | 'content';
  message: string; // <-- FIXED: Was 'content'
  status: 'new' | 'investigating' | 'resolved';
  buildHash: string;
  environment: string;
  vaultUnlocked: boolean;
  route: string;
  userAgent: string;
  timestamp?: Timestamp; // <-- FIXED: Was 'createdAt'
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
                // Fallbacks just in case old data exists
                message: raw.message || raw.content || '',
                timestamp: raw.timestamp || raw.createdAt || null
            } as FeedbackReport;
        });
        
        // Sort safely in JavaScript
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

  if (loading) return <div className="p-4 text-slate-400">Loading inbox...</div>;

  return (
    <div className="space-y-4">
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
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"✅ Updated: {path}")

if __name__ == "__main__":
    write_file("src/components/admin/FeedbackViewer.tsx", feedback_viewer_code)
    print("✨ Schema mismatch resolved. Messages and dates should now be visible!")