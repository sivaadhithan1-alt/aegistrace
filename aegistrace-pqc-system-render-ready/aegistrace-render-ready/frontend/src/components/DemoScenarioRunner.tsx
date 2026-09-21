import React, { useState } from 'react';
import {
  Play, CheckCircle, ShieldCheck, FileSearch, ArrowRight,
  Download, Database, Key, Lock, Unlock, AlertTriangle, RefreshCw
} from 'lucide-react';
import { api } from '../api/client';

export const DemoScenarioRunner: React.FC = () => {
  const [running, setRunning] = useState<boolean>(false);
  const [scenarioData, setScenarioData] = useState<any | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const runFullDemo = async () => {
    setRunning(true);
    setError(null);
    setScenarioData(null);
    try {
      const res = await api.runDemoScenario();
      setScenarioData(res);
      setActiveStepIndex(res.steps?.length - 1 || 0);
    } catch (err: any) {
      setError(err.message || 'Demo scenario execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleDownloadEvidence = () => {
    if (!scenarioData?.evidence_package) return;
    const jsonStr = JSON.stringify(scenarioData.evidence_package, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Evidence_${scenarioData.evidence_package.dossier?.evidence_id || 'DEMO'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-900/30 text-white shrink-0">
            <Play className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">END-TO-END DEMO SCENARIO RUNNER</h1>
            <p className="text-xs text-slate-400">
              Interactive 14-Step Multi-Recipient PQC Encryption, Invisible Fingerprinting & Leaked Document Attribution
            </p>
          </div>
        </div>

        <button
          onClick={runFullDemo}
          disabled={running}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all shrink-0"
        >
          <Play className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Executing PQC Pipeline & Consensus...' : 'Run Complete 14-Step Demo'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scenario Pipeline Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Scenario Flowchart (Alice → Bob + Charlie + David → Simulated Leak → Attribution)
          </h3>
          <span className="text-xs text-cyan-400 font-mono">100% OFFLINE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              1. Distribution
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Alice encrypts <code className="text-white">classified_report.pdf</code> with AES-256-GCM and wraps key for Bob, Charlie, and David using ML-KEM-768.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5" />
              2. Independent Decryption
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Bob, Charlie, and David independently decrypt. Each receives unique covert fingerprint (FP-A, FP-B, FP-C) and signs with ML-DSA-65.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              3. Suspect Leak
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Bob's decrypted PDF document leaks outside authorized channels. All 3 files look visually identical under normal inspection.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-purple-400 font-bold flex items-center gap-1.5">
              <FileSearch className="w-3.5 h-3.5" />
              4. Forensic Attribution
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Investigator uploads suspect file. Engine extracts Fingerprint #A, verifies Bob's ML-DSA signature on the ledger, and proves leak origin!
            </p>
          </div>
        </div>
      </div>

      {/* Execution Results */}
      {scenarioData && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary Result Banner */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-600/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/40 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-900/40">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    FORENSIC ATTRIBUTION COMPLETE: LEAK ORIGIN CRYPTOGRAPHICALLY PROVEN
                  </h3>
                  <p className="text-xs text-emerald-300 font-mono">
                    Attributed Leaker: <strong className="text-white">{scenarioData.scenario_summary.attributed_leaker}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadEvidence}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 flex items-center gap-2 self-start sm:self-auto transition-all"
              >
                <Download className="w-4 h-4" />
                Download Signed Evidence Dossier
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-500 text-[10px]">BOB'S DECRYPTION (LEAKED)</div>
                <div className="text-cyan-400 font-bold truncate">{scenarioData.scenario_summary.bob_fingerprint}</div>
                <div className="text-emerald-400 text-[10px]">✓ Matched on Leaked Document</div>
              </div>

              <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-500 text-[10px]">CHARLIE'S DECRYPTION</div>
                <div className="text-slate-300 font-bold truncate">{scenarioData.scenario_summary.charlie_fingerprint}</div>
                <div className="text-slate-500 text-[10px]">Unique Fingerprint #B (Different)</div>
              </div>

              <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-500 text-[10px]">DAVID'S DECRYPTION</div>
                <div className="text-slate-300 font-bold truncate">{scenarioData.scenario_summary.david_fingerprint}</div>
                <div className="text-slate-500 text-[10px]">Unique Fingerprint #C (Different)</div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Timeline Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Detailed Execution Log ({scenarioData.steps.length} Steps)
            </h3>

            <div className="space-y-3">
              {scenarioData.steps.map((st: any, idx: number) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {st.step}
                      </span>
                      <span className="font-bold text-white font-sans text-xs">{st.title}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400">✓ Completed</span>
                  </div>

                  <p className="text-[11px] text-slate-300 font-sans">{st.description}</p>

                  {st.data && (
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 text-[10px] text-slate-400 overflow-x-auto">
                      <pre>{JSON.stringify(st.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
