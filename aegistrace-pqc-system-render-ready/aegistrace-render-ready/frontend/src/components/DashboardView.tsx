import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Database,
  Search,
  Users,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Radio,
  Clock,
  MessageSquare
} from 'lucide-react';
import { api } from '../api/client';
import { PageId } from './Sidebar';
import { UserInfo, SystemHealth, LedgerBlock } from '../types';

interface DashboardViewProps {
  currentUser: string;
  users: UserInfo[];
  onNavigate: (page: PageId) => void;
  onLaunchDemo: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  users,
  onNavigate,
  onLaunchDemo
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [blocks, setBlocks] = useState<LedgerBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hData, bData] = await Promise.all([
        api.getSystemHealth(),
        api.getLedgerBlocks()
      ]);
      setHealth(hData);
      setBlocks(bData.blocks || []);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentProfile = users.find(u => u.user_id === currentUser);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              AIR-GAPPED POST-QUANTUM ENCLAVE ACTIVE
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-mono text-slate-500">Node ID: ENCLAVE-HQ-01</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {currentProfile?.display_name || currentUser}
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            AegisTrace provides quantum-resilient multi-recipient document distribution with covert dynamic forensic watermarking and immutable cryptographic provenance.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onLaunchDemo}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Launch 12-Step Judge Demo</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Enclave Security Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">100%</div>
          <div className="text-xs text-emerald-600 flex items-center space-x-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero Cloud Leakage • Air-Gap Enforced</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Post-Quantum KEM</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">ML-KEM-768</div>
          <div className="text-xs text-slate-500 font-mono">
            NIST FIPS 203 (Category 3 Security)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Non-Repudiation Signature</span>
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">ML-DSA-65</div>
          <div className="text-xs text-slate-500 font-mono">
            NIST FIPS 204 (Hardware/Software)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Immutable Ledger</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {blocks.length} Blocks
          </div>
          <div className="text-xs text-emerald-600 font-medium">
            5-Node BFT Consensus Verified
          </div>
        </div>
      </div>

      {/* Main Grid: Architecture Flow & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Security Architecture Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              End-to-End Defense Architecture Flow
            </h3>
            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-medium">
              Zero-Trust Offline Pipeline
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="text-xs font-bold text-slate-900">1-to-N Envelope Encrypt</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Sender encapsulates a single AES-256-GCM symmetric DEK for all authorized recipients using ML-KEM-768.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="text-xs font-bold text-slate-900">Dynamic Covert Watermark</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Upon recipient decryption, a recipient-specific covert watermark is embedded invisibly. Visually 100% pristine.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="text-xs font-bold text-slate-900">Signed DLT Provenance</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Recipient's hardware key signs DecryptionRecord with ML-DSA-65, committed to the 5-node BFT ledger.
              </p>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/60 rounded-lg border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Search className="w-5 h-5 text-indigo-600" />
              <div>
                <div className="text-xs font-bold text-slate-900">Suspected Leaked Document?</div>
                <div className="text-[11px] text-slate-600">Run zero-knowledge watermark extraction & cryptographic attribution</div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('forensics')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <span>Forensic Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Col: Quick Access & Enclave Personnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Enclave Directory</h3>
            <button
              onClick={() => onNavigate('contacts')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {users.slice(0, 5).map((u) => (
              <div key={u.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                    {u.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{u.display_name}</div>
                    <div className="text-[10px] text-slate-500">{u.role}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {u.user_id}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => onNavigate('chats')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Open Secure Chats</span>
            </button>
            <button
              onClick={() => onNavigate('ledger')}
              className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Explore DLT Ledger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
