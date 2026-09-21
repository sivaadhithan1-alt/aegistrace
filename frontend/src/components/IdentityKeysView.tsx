import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Copy,
  Check,
  FileCheck,
  Lock,
  Cpu,
  X
} from 'lucide-react';
import { UserInfo } from '../types';
import { api } from '../api/client';

interface IdentityKeysViewProps {
  users: UserInfo[];
  currentUser: string;
  onRefresh: () => void;
}

export const IdentityKeysView: React.FC<IdentityKeysViewProps> = ({ users, currentUser, onRefresh }) => {
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(users[0] || null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [newUserId, setNewUserId] = useState<string>('');
  const [newDisplayName, setNewDisplayName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('recipient');
  const [newPassword, setNewPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0]);
    }
  }, [users]);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleEnroll = async () => {
    if (!newUserId || !newDisplayName || !newPassword) {
      setError('All fields are required.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.registerUser({
        user_id: newUserId.toLowerCase().trim(),
        display_name: newDisplayName.trim(),
        role: newRole,
        password: newPassword
      });
      setIsEnrollModalOpen(false);
      setNewUserId('');
      setNewDisplayName('');
      setNewPassword('');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Air-Gapped PKI & Post-Quantum Key Authority
          </h2>
          <p className="text-xs text-slate-500">
            Local Root Certificate Authority managing X.509-PQC hybrid identity credentials
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh PKI Registry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Enroll New Identity</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Officer List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col h-[520px]">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider shrink-0">
            Enrolled Enclave Certificates ({users.length})
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {users.map((u) => {
              const isSelected = selectedUser?.user_id === u.user_id;
              return (
                <div
                  key={u.user_id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs">{u.display_name}</span>
                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {u.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    ID: @{u.user_id}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Detailed X.509-PQC Certificate View (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5 overflow-y-auto max-h-[520px]">
          {selectedUser ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {selectedUser.user_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedUser.display_name}</h3>
                    <div className="text-xs text-slate-500 font-mono">
                      Certificate ID: {selectedUser.certificate?.subject?.certificate_id || 'CERT-ACTIVE'}
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  AUTHENTICATED X.509-PQC
                </span>
              </div>

              {/* Certificate Metadata */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">ISSUING AUTHORITY</span>
                  <span className="font-semibold text-slate-900">{selectedUser.certificate?.subject?.issuer_name || 'AegisTrace Defense CA'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SHA3-256 THUMBPRINT</span>
                  <span className="font-semibold text-indigo-700 break-all">{selectedUser.certificate?.thumbprint_sha3?.slice(0, 24)}...</span>
                </div>
              </div>

              {/* Cryptographic Public Keys */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>Public Key Material (Non-Confidential)</span>
                </h4>

                <div className="space-y-3 font-mono text-xs">
                  {/* KEM Public Key */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                        ML-KEM-768 Public Key (FIPS 203)
                      </span>
                      <button
                        onClick={() => handleCopy(selectedUser.certificate?.subject?.public_keys?.kem_public_key || '', 'kem')}
                        className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        {copiedKey === 'kem' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'kem' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-[10px] text-slate-600 break-all select-all">
                      {selectedUser.certificate?.subject?.public_keys?.kem_public_key || 'ML-KEM-PK-MATERIAL'}
                    </div>
                  </div>

                  {/* DSA Public Key */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        ML-DSA-65 Verification Key (FIPS 204)
                      </span>
                      <button
                        onClick={() => handleCopy(selectedUser.certificate?.subject?.public_keys?.dsa_public_key || '', 'dsa')}
                        className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        {copiedKey === 'dsa' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'dsa' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-[10px] text-slate-600 break-all select-all">
                      {selectedUser.certificate?.subject?.public_keys?.dsa_public_key || 'ML-DSA-PK-MATERIAL'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select an officer certificate to view public key material.
            </div>
          )}
        </div>
      </div>

      {/* Enroll Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Enroll Defense Identity</h3>
              <button onClick={() => setIsEnrollModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">User Identifier</label>
                <input
                  type="text"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="e.g. kiran"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Officer Kiran (Surveillance)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Enclave Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="recipient">Recipient Officer</option>
                  <option value="sender">Sender Officer</option>
                  <option value="investigator">Forensic Investigator</option>
                  <option value="auditor">Security Auditor</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Keystore Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set keystore passphrase"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={loading}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Generating PQC Keys...' : 'Generate & Enroll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
