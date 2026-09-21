import React, { useState, useEffect } from 'react';
import {
  Shield, Key, Users, Database, AlertTriangle, CheckCircle,
  FileText, Activity, Lock, RefreshCw, XCircle, ShieldAlert
} from 'lucide-react';
import { SystemHealth, UserInfo } from '../types';
import { api, API_BASE } from '../api/client';

interface AdminDashboardProps {
  currentUser: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [crl, setCrl] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Revoke state
  const [revokeUserId, setRevokeUserId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [adminPwd, setAdminPwd] = useState<string>('admin123');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const h = await api.getSystemHealth();
      setHealth(h);
      const u = await api.listUsers();
      setUsers(u);
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
      const crlRes = await fetch(`${API_BASE}/auth/crl`);
      if (crlRes.ok) {
        const crlData = await crlRes.json();
        setCrl(crlData.revocations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeUser = async () => {
    if (!revokeUserId || !revokeReason) return;
    try {
      const res = await fetch(`${API_BASE}/auth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'admin'
        },
        body: JSON.stringify({
          target_user_id: revokeUserId,
          reason: revokeReason,
          admin_password: adminPwd
        })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || 'Revocation failed');
        return;
      }
      setRevokeUserId(null);
      setRevokeReason('');
      await loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-amber-900/30 text-white shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">SECURITY CHIEF ADMINISTRATOR & PKI</h1>
            <p className="text-xs text-slate-400">
              Offline Institutional Trust Authority, Certificate Revocation (CRL), and Audit Logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            AIR-GAP ENFORCED
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">OFFLINE ROOT CA</div>
            <div className="text-sm font-bold text-emerald-400 truncate">{health.identity_pki.root_ca_id}</div>
            <div className="text-[10px] text-slate-400">{health.identity_pki.enrolled_users_count} PQC Certificates Issued</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">PQC CRYPTO SUITE</div>
            <div className="text-sm font-bold text-cyan-400">{health.crypto_suite.kem}</div>
            <div className="text-[10px] text-slate-400">{health.crypto_suite.signature} / {health.crypto_suite.aead}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">LEDGER CONSENSUS</div>
            <div className="text-sm font-bold text-white">Block #{health.ledger_consensus.latest_block_height}</div>
            <div className="text-[10px] text-emerald-400">{health.ledger_consensus.online_validators} / {health.ledger_consensus.total_validators} Validators Online</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">ENCLAVE PROVENANCE</div>
            <div className="text-sm font-bold text-purple-400">{health.storage_metrics.total_forensic_decryption_events} Decryptions</div>
            <div className="text-[10px] text-slate-400">{health.storage_metrics.total_encrypted_documents} .SDOC Packages</div>
          </div>
        </div>
      )}

      {/* Enrolled PQC Identity Certificates Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 font-sans">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Institutional Post-Quantum Identity Registry
            </h3>
            <p className="text-xs text-slate-400">
              Users holding NIST FIPS 203 (ML-KEM-768) and FIPS 204 (ML-DSA-65) keypairs
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Certificate ID</th>
                <th className="py-2.5 px-3">ML-KEM Key Thumbprint</th>
                <th className="py-2.5 px-3">ML-DSA Key Thumbprint</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map(u => {
                const pk = u.certificate?.subject?.public_keys;
                const isRevoked = u.status === 'REVOKED';

                return (
                  <tr key={u.user_id} className="hover:bg-slate-800/40 transition-all">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white font-sans">{u.display_name}</div>
                      <div className="text-[10px] text-slate-500">@{u.user_id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isRevoked ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {u.certificate?.subject?.certificate_id || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-cyan-400 text-[11px]">
                      {pk?.kem_public_key?.slice(0, 16)}...
                    </td>
                    <td className="py-3 px-3 text-emerald-400 text-[11px]">
                      {pk?.dsa_public_key?.slice(0, 16)}...
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!isRevoked && u.user_id !== 'admin' && (
                        <button
                          onClick={() => setRevokeUserId(u.user_id)}
                          className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[10px] transition-all"
                        >
                          Revoke Certificate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoke Modal */}
      {revokeUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400 font-bold">
              <ShieldAlert className="w-6 h-6" />
              <span>Revoke Identity Certificate (@{revokeUserId})</span>
            </div>
            <p className="text-xs text-slate-400">
              Revoking this certificate will invalidate the user's ML-KEM encryption rights and record the revocation in the air-gapped CRL.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Revocation Reason</label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Compromised endpoint / Security policy violation"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Admin Password</label>
              <input
                type="password"
                value={adminPwd}
                onChange={(e) => setAdminPwd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRevokeUserId(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeUser}
                disabled={!revokeReason}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Security Audit Log Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-sans">
              Immutable Security Audit Log Stream ({auditLogs.length})
            </h3>
          </div>
          <button
            onClick={loadAdminData}
            className="p-1 text-slate-400 hover:text-white"
            title="Refresh Audit Logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {auditLogs.map((log, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold">{log.action}</span>
                <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Actor: <strong className="text-slate-200">@{log.actor_id}</strong></span>
                {log.target_id && <span>Target: <strong className="text-slate-200">{log.target_id}</strong></span>}
                <span className="text-slate-500">{log.ip_address}</span>
              </div>
              {log.details && Object.keys(log.details).length > 0 && (
                <div className="text-[10px] text-slate-500 truncate bg-slate-900/60 p-1.5 rounded">
                  {JSON.stringify(log.details)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
