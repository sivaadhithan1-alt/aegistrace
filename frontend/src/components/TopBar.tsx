import React from 'react';
import { ShieldCheck, Cpu, PlayCircle, Lock, RefreshCw, Key, Menu } from 'lucide-react';
import { PageId } from './Sidebar';
import { UserInfo } from '../types';

interface TopBarProps {
  currentPage: PageId;
  currentUser: string;
  users: UserInfo[];
  onOpenDemo: () => void;
  onRefresh?: () => void;
  onOpenMobileNav?: () => void;
}

const PAGE_TITLES: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Operations Dashboard', subtitle: 'Post-Quantum document distribution overview and real-time enclave health' },
  chats: { title: 'Joint Tactical Comms & Secure Messaging', subtitle: 'WhatsApp-grade offline messaging with PQC envelope encryption' },
  contacts: { title: 'Enclave Officer Directory', subtitle: 'Verified defense personnel, clearance levels, and PKI public certificates' },
  documents: { title: 'Secure Document Repository', subtitle: 'Multi-recipient .SDOC containers with non-repudiation audit records' },
  security: { title: 'Post-Quantum Cryptographic Security Center', subtitle: 'FIPS 203 ML-KEM, FIPS 204 ML-DSA, CRL, and entropy monitors' },
  encryption: { title: 'PQC Encryption & Decryption Lab', subtitle: 'Manual container generator and multi-recipient key decapsulation testbed' },
  ledger: { title: 'Permissioned DLT Audit Ledger', subtitle: '5-Node Byzantine Fault Tolerant consensus with Merkle provenance proofs' },
  forensics: { title: 'Forensic Investigation & Attribution Lab', subtitle: 'Zero-knowledge watermark extraction & cryptographic provenance matching' },
  identity: { title: 'Air-Gapped PKI & Identity Authority', subtitle: 'Local Root CA, X.509-PQC certificates, and hardware key registries' },
  system: { title: 'Enclave System Metrics & Benchmarks', subtitle: 'Hardware diagnostics, crypto performance benchmarks, and storage health' },
  settings: { title: 'Security Enclave Policies & Configuration', subtitle: 'Access policies, forensic adapter priorities, and audit export tools' },
  demo: { title: 'SIH Judge Evaluation Demo', subtitle: '12-step guided demonstration of multi-recipient distribution and leak attribution' },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentPage,
  currentUser,
  users,
  onOpenDemo,
  onRefresh,
  onOpenMobileNav
}) => {
  const currentProfile = users.find(u => u.user_id === currentUser);
  const pageInfo = PAGE_TITLES[currentPage] || { title: 'AegisTrace Enclave', subtitle: 'Secure Defense Workspace' };

  return (
    <header className="min-h-16 bg-white border-b border-slate-200 px-3 sm:px-4 md:px-6 py-2 flex items-center justify-between gap-2 shrink-0 shadow-2xs z-30">
      <div className="flex items-center gap-2 min-w-0">
      <div className="min-w-0">
        <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
          {pageInfo.title}
        </h1>
        <p className="hidden sm:block text-xs text-slate-500 font-normal truncate max-w-[48vw]">
          {pageInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            aria-label="Open navigation"
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Post-Quantum Suite Badge */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
          <span>FIPS 203 ML-KEM-768</span>
          <span className="text-slate-300">|</span>
          <span>FIPS 204 ML-DSA-65</span>
        </div>

        {/* SIH Judge Demo CTA */}
        <button
          onClick={onOpenDemo}
          className="flex items-center space-x-1.5 px-2 sm:px-3 py-2 sm:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Launch SIH Judge Demo</span><span className="sm:hidden">Demo</span>
        </button>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh View"
            className="p-2 sm:p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Current Officer Profile Badge */}
        <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
            {currentProfile ? currentProfile.display_name.slice(0, 2).toUpperCase() : 'OP'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {currentProfile ? currentProfile.display_name : currentUser}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {currentProfile ? currentProfile.role : 'Authorized'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
