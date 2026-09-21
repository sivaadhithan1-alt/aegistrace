import React from 'react';
import { Shield, Lock, Radio, Key, Users, FileSearch, Database, PlayCircle } from 'lucide-react';
import { UserInfo } from '../types';

interface HeaderProps {
  activeTab: 'messages' | 'forensics' | 'ledger' | 'admin' | 'demo';
  setActiveTab: (tab: 'messages' | 'forensics' | 'ledger' | 'admin' | 'demo') => void;
  currentUser: string;
  users: UserInfo[];
  onSelectUser: (userId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  users,
  onSelectUser
}) => {
  const currentProfile = users.find(u => u.user_id === currentUser);

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">AEGISTRACE</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-700/50 rounded">
                  PQC ENCLAVE
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-700/50 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  AIR-GAPPED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Immutable Decryption Provenance & Forensic Attribution
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'messages'
                  ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Messaging</span>
            </button>

            <button
              onClick={() => setActiveTab('forensics')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'forensics'
                  ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Forensic Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'ledger'
                  ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Ledger Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Security & PKI</span>
            </button>

            <button
              onClick={() => setActiveTab('demo')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'demo'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-900/30'
                  : 'text-cyan-400 hover:text-cyan-200 hover:bg-slate-900/50 font-semibold'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Guided Demo</span>
            </button>
          </nav>

          {/* User Role Switcher */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{currentProfile?.display_name || currentUser}</div>
              <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">
                ROLE: {currentProfile?.role || 'User'}
              </div>
            </div>

            <select
              value={currentUser}
              onChange={(e) => onSelectUser(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-emerald-500 focus:border-emerald-500 font-mono outline-none cursor-pointer"
            >
              <option value="alice">Alice (Sender)</option>
              <option value="bob">Bob (Recipient A)</option>
              <option value="charlie">Charlie (Recipient B)</option>
              <option value="david">David (Recipient C)</option>
              <option value="investigator">Frank (Investigator)</option>
              <option value="auditor">Grace (Auditor)</option>
              <option value="admin">Admin (Security Chief)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
