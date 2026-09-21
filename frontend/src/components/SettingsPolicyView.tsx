import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  FileCheck,
  Download,
  CheckCircle2,
  Lock,
  Layers,
  Radio,
  Clock,
  Terminal,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';

export const SettingsPolicyView: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [airGapStrict, setAirGapStrict] = useState<boolean>(true);
  const [dynamicWatermarkDefault, setDynamicWatermarkDefault] = useState<boolean>(true);
  const [quorumThreshold, setQuorumThreshold] = useState<number>(3);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const logs = await api.getAuditLogs();
      setAuditLogs(logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAuditLogs = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AegisTrace_AuditLogs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Security Enclave Policies & Configuration
          </h2>
          <p className="text-xs text-slate-500">
            Governance rules, air-gap isolation enforcement, and immutable audit logs
          </p>
        </div>

        <button
          onClick={handleExportAuditLogs}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log Trail</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Policy Configuration Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Enclave Security Governance Rules</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Air-gap strictness */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Strict Air-Gap Isolation</div>
                <div className="text-slate-500 text-[11px]">Blocks any external outbound TCP connections</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={airGapStrict}
                  onChange={(e) => setAirGapStrict(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Dynamic Watermark Default */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Dynamic Watermarking by Default</div>
                <div className="text-slate-500 text-[11px]">Automatically embeds covert attribution on decryption</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dynamicWatermarkDefault}
                  onChange={(e) => setDynamicWatermarkDefault(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* BFT Quorum Threshold */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">BFT Consensus Quorum Threshold</span>
                <span className="font-bold text-indigo-700 font-mono">{quorumThreshold} / 5 Nodes (60%)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Minimum number of cryptographic signatures required to seal a DLT block.
              </p>
            </div>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col h-[460px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>Immutable Audit Event Stream</span>
            </h3>
            <button
              onClick={loadAuditLogs}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] pr-1">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No audit events recorded yet.
              </div>
            ) : (
              auditLogs.slice().reverse().map((log, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1 text-slate-700">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-indigo-700">{log.action}</span>
                    <span className="text-slate-400">{log.timestamp}</span>
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Actor: <span className="text-slate-800 font-bold">@{log.user_id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
