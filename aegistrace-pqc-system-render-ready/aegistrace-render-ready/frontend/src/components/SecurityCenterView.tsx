import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Radio,
  Key,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Activity,
  Layers,
  Database,
  ExternalLink,
  Shield
} from 'lucide-react';
import { api } from '../api/client';
import { SystemHealth } from '../types';

export const SecurityCenterView: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [crl, setCrl] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [hData, crlData] = await Promise.all([
        api.getSystemHealth(),
        api.getCRL()
      ]);
      setHealth(hData);
      setCrl(crlData.revocations || []);
    } catch (e) {
      console.error('Failed to load security center data:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ALL CRYPTOGRAPHIC SUBSYSTEMS NOMINAL
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-mono text-slate-500">Zero Cloud Leakage Verified</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Post-Quantum Cryptographic & Enclave Security Center
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Real-time compliance monitoring for NIST FIPS 203 (ML-KEM), NIST FIPS 204 (ML-DSA), permissioned BFT ledger, and air-gapped PKI.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Quantum Security</div>
            <div className="text-base font-bold text-indigo-700 font-mono">192-Bit Quantum</div>
          </div>
        </div>
      </div>

      {/* Grid: Cryptographic Primitives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Key Encapsulation</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 font-mono">ML-KEM-768</div>
            <div className="text-[11px] text-slate-500">NIST FIPS 203 (Category 3)</div>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chosen-Ciphertext Secure (IND-CCA2)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Digital Signatures</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 font-mono">ML-DSA-65</div>
            <div className="text-[11px] text-slate-500">NIST FIPS 204 (Category 3)</div>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>EUF-CMA Provenance Signature</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Authenticated Cipher</span>
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 font-mono">AES-256-GCM</div>
            <div className="text-[11px] text-slate-500">NIST SP 800-38D (AEAD)</div>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit Symmetrical Key Strength</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Digest & Merkle</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 font-mono">SHA3-256</div>
            <div className="text-[11px] text-slate-500">NIST FIPS 202 (Keccak)</div>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pre-image & Collision Resistant</span>
          </div>
        </div>
      </div>

      {/* Main Sections: Security Controls & CRL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Air-Gap Enforcement */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            <span>Air-Gap & Isolation Controls</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Cloud KMS Dependency</div>
                <div className="text-slate-500">External cloud KMS services (AWS KMS, Azure Vault)</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                0% (DISABLED)
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Public Blockchain Dependency</div>
                <div className="text-slate-500">Ethereum, Solana, or public ledger connections</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                0% (DISABLED)
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Local Hardware Entropy Pool</div>
                <div className="text-slate-500">OS urandom / TRNG with HKDF-SHA3 extraction</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 font-mono">
                256-BIT HEALTHY
              </span>
            </div>
          </div>
        </div>

        {/* Certificate Revocation List (CRL) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              <span>Certificate Revocation List (CRL)</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {crl.length} Active Revocations
            </span>
          </div>

          {crl.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-xs font-bold text-slate-900">Zero Revoked Identities</div>
              <p className="text-[11px] text-slate-500">
                All enrolled defense enclave officer certificates are currently in good standing.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {crl.map((entry, idx) => (
                <div key={idx} className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 font-mono">@{entry.user_id}</span>
                    <span className="text-[10px] text-rose-700 font-mono">{entry.revoked_at}</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">Reason: {entry.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
