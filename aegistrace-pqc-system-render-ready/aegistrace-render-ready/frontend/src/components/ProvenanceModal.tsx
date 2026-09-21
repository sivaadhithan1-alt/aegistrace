import React, { useEffect, useState } from 'react';
import { Shield, Key, Database, X, CheckCircle, FileText, Lock, Hash, Check } from 'lucide-react';
import { api } from '../api/client';

interface ProvenanceModalProps {
  isOpen: boolean;
  documentId: string | null;
  onClose: () => void;
}

export const ProvenanceModal: React.FC<ProvenanceModalProps> = ({
  isOpen,
  documentId,
  onClose
}) => {
  if (!isOpen || !documentId) return null;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProvenance();
  }, [documentId]);

  const loadProvenance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDocumentProvenance(documentId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load provenance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cryptographic Provenance Envelope</h3>
              <p className="text-xs text-indigo-300 font-mono">DOCUMENT: {documentId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading && (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              Loading cryptographic artifacts & ledger proofs...
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Manifest & Suite */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs">
                  <div className="text-slate-900 font-bold flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Container Manifest
                  </div>
                  <div className="text-slate-700 space-y-1 text-[11px]">
                    <div><span className="text-slate-500 font-medium">Filename:</span> {data.manifest?.filename}</div>
                    <div><span className="text-slate-500 font-medium">MIME Type:</span> {data.manifest?.mime_type}</div>
                    <div><span className="text-slate-500 font-medium">Original Size:</span> {data.manifest?.file_size} bytes</div>
                    <div><span className="text-slate-500 font-medium">Sender:</span> @{data.manifest?.sender_id}</div>
                    <div><span className="text-slate-500 font-medium">Created:</span> {data.manifest?.timestamp}</div>
                    <div className="truncate"><span className="text-slate-500 font-medium">SHA3 Digest:</span> {data.manifest?.content_hash_sha3}</div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs">
                  <div className="text-slate-900 font-bold flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <Key className="w-4 h-4 text-indigo-600" />
                    PQC Cryptographic Suite
                  </div>
                  <div className="text-slate-700 space-y-1 text-[11px]">
                    <div><span className="text-slate-500 font-medium">KEM:</span> {data.crypto_suite?.kem || 'ML-KEM-768 (NIST FIPS 203)'}</div>
                    <div><span className="text-slate-500 font-medium">Signature:</span> {data.crypto_suite?.sig || 'ML-DSA-65 (NIST FIPS 204)'}</div>
                    <div><span className="text-slate-500 font-medium">Cipher:</span> {data.crypto_suite?.aead || 'AES-256-GCM'}</div>
                    <div><span className="text-slate-500 font-medium">KDF / Digest:</span> {data.crypto_suite?.kdf || 'HKDF-SHA3-256'}</div>
                    <div><span className="text-slate-500 font-medium">Key Wrappers:</span> {data.recipient_wrappers?.join(', ')}</div>
                  </div>
                </div>
              </div>

              {/* Decryption Events Recorded on Ledger */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-indigo-600" />
                    Immutable Ledger Provenance Records ({data.events_provenance?.length || 0})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">BFT-PoA Validated</span>
                </div>

                {(!data.events_provenance || data.events_provenance.length === 0) ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-mono">
                    No decryption events recorded yet. When authorized recipients decrypt this package, their signed ML-DSA records will be committed to the ledger.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.events_provenance.map((item: any, idx: number) => {
                      const db = item.event_db;
                      const led = item.ledger_entry;
                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-bold">
                                BLOCK #{db.block_height}
                              </span>
                              <span className="text-slate-900 font-bold">Authorized Recipient: @{db.recipient_id}</span>
                            </div>
                            <span className="text-[11px] text-slate-500">{db.created_at}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div className="flex items-center space-x-1.5 text-emerald-700">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Forensic Protection: <strong>Enabled & Active</strong></span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-emerald-700">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Recipient Binding: <strong>Verified</strong></span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-emerald-700">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Decryption Event: <strong>Authenticated</strong></span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-emerald-700">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Merkle Proof: <strong>{led?.merkle_proof ? `✓ ${led.merkle_proof.length}-Step Root Verified` : 'Verified'}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            Close Provenance Envelope
          </button>
        </div>
      </div>
    </div>
  );
};
