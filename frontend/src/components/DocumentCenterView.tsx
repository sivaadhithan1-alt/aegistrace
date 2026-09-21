import React, { useState, useEffect } from 'react';
import {
  FileText,
  Lock,
  Unlock,
  ShieldCheck,
  Download,
  Users,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { PageId } from './Sidebar';

interface DocumentCenterViewProps {
  currentUser: string;
  onNavigate: (page: PageId) => void;
}

export const DocumentCenterView: React.FC<DocumentCenterViewProps> = ({
  currentUser,
  onNavigate
}) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    loadDocuments();
  }, [currentUser]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.listDocuments();
      setDocuments(docs || []);
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSdoc = (docId: string, filename: string) => {
    const url = `/api/documents/${docId}/sdoc`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docId}.sdoc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredDocs = documents.filter(d =>
    (d.original_filename || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.document_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.sender_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Secure Document Repository
          </h2>
          <p className="text-xs text-slate-500">
            Multi-recipient post-quantum .SDOC containers with recipient-specific dynamic forensic binding
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="bg-white border border-slate-200 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={loadDocuments}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('encryption')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Encrypt New File</span>
          </button>
        </div>
      </div>

      {/* Documents Table / Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Encrypted Documents Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You can send an encrypted document in Chats or use the PQC Encryption Lab to generate a .SDOC multi-recipient container.
          </p>
          <button
            onClick={() => onNavigate('encryption')}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Open Encryption Lab
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Crypto Scheme</th>
                  <th className="py-3 px-4">Protection</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((d) => (
                  <tr key={d.document_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {d.original_filename}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {d.document_id} • {(d.file_size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      @{d.sender_id}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-medium">
                        AES-256-GCM + ML-KEM-768
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {d.fingerprint_enabled ? (
                        <span className="inline-flex items-center text-emerald-700 text-[11px] font-medium gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dynamic Protected</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard Encrypted</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleDownloadSdoc(d.document_id, d.original_filename)}
                        className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-semibold transition-colors cursor-pointer"
                        title="Download raw .SDOC package"
                      >
                        Download .SDOC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
