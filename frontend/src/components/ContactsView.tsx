import React, { useState } from 'react';
import {
  Users,
  Shield,
  Key,
  CheckCircle2,
  Lock,
  MessageSquare,
  Search,
  Sparkles,
  UserPlus,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { UserInfo } from '../types';
import { PageId } from './Sidebar';

interface ContactsViewProps {
  users: UserInfo[];
  currentUser: string;
  onSelectUser: (userId: string) => void;
  onNavigate: (page: PageId) => void;
  onRefresh: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  users,
  currentUser,
  onSelectUser,
  onNavigate,
  onRefresh
}) => {
  const [search, setSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyThumbprint = (thumbprint: string, id: string) => {
    navigator.clipboard.writeText(thumbprint);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = users.filter(u =>
    u.display_name.toLowerCase().includes(search.toLowerCase()) ||
    u.user_id.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Defense Enclave Contacts & PKI Directory
          </h2>
          <p className="text-xs text-slate-500">
            Verified officers with authenticated Post-Quantum X.509-PQC credentials
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search officer or ID..."
              className="bg-white border border-slate-200 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
          <p className="text-xs text-slate-500">No contacts matching "{search}".</p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            [ Use Demo Contacts ]
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const isCurrent = u.user_id === currentUser;
            const cert = u.certificate;
            const kemAlg = cert?.subject?.public_keys?.kem_algorithm || 'ML-KEM-768';
            const sigAlg = cert?.subject?.public_keys?.signature_algorithm || 'ML-DSA-65';
            const thumbprint = cert?.thumbprint_sha3?.slice(0, 16) || 'SHA3-VERIFIED';

            return (
              <div
                key={u.user_id}
                className={`bg-white rounded-xl border p-5 space-y-4 shadow-xs transition-all ${
                  isCurrent ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                      {u.display_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900">{u.display_name}</h3>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[9px] font-bold rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">@{u.user_id}</div>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                    VERIFIED
                  </span>
                </div>

                {/* Role & Clearance */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ENCLAVE ROLE</span>
                    <span className="font-semibold text-slate-800 capitalize">{u.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CLEARANCE</span>
                    <span className="font-semibold text-indigo-700">LEVEL 5 SECRET</span>
                  </div>
                </div>

                {/* Crypto Keys Overview */}
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">KEM Key:</span>
                    <span className="text-indigo-600 font-semibold">{kemAlg}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Signing Key:</span>
                    <span className="text-indigo-600 font-semibold">{sigAlg}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                    <span className="text-slate-400">Cert Digest:</span>
                    <button
                      onClick={() => handleCopyThumbprint(cert?.thumbprint_sha3 || thumbprint, u.user_id)}
                      className="text-slate-700 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                      title="Click to copy full SHA3 thumbprint"
                    >
                      <span>{thumbprint}...</span>
                      {copiedId === u.user_id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectUser(u.user_id);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isCurrent ? 'Active Persona' : 'Switch Persona'}
                  </button>

                  <button
                    onClick={() => onNavigate('chats')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
