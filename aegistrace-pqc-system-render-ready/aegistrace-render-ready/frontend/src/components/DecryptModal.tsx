import React, { useState } from 'react';
import { Lock, Unlock, ShieldCheck, CheckCircle2, FileText, Download, AlertTriangle, X, Check } from 'lucide-react';
import { Message } from '../types';

interface DecryptModalProps {
  isOpen: boolean;
  message: Message | null;
  currentUser: string;
  onClose: () => void;
  onDecrypt: (documentId: string, passphrase: string) => Promise<any>;
  onInspectProvenance: (documentId: string) => void;
}

export const DecryptModal: React.FC<DecryptModalProps> = ({
  isOpen,
  message,
  currentUser,
  onClose,
  onDecrypt,
  onInspectProvenance
}) => {
  if (!isOpen || !message || !message.document_id) return null;

  const [passphrase, setPassphrase] = useState<string>(
    ['arjun', 'priya', 'rahul', 'vikram', 'meera', 'auditor', 'admin'].includes(currentUser)
      ? `${currentUser}_secret`
      : `${currentUser}123`
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [decryptedResult, setDecryptedResult] = useState<any | null>(null);

  const doc = message.document_info;
  const originalFilename = doc?.filename || 'classified_report.pdf';

  const handleDecrypt = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await onDecrypt(message.document_id!, passphrase);
      setDecryptedResult(res);
    } catch (err: any) {
      setError(err.message || 'Identity verification or decryption failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!decryptedResult || !decryptedResult.raw_decrypted_bytes) return;
    const byteString = atob(decryptedResult.raw_decrypted_bytes);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: decryptedResult.mime_type || 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // ALWAYS download as original authentic filename (NEVER FP-xxx)
    a.download = originalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Secure Document Decryption</h3>
              <p className="text-xs text-slate-500">ML-KEM-768 Decapsulation & Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Clean Document Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-sm font-bold text-slate-900">{originalFilename}</div>
                  <div className="text-[11px] text-slate-500">
                    Sender: <span className="font-medium text-slate-700">{message.sender_id}</span>
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Lock className="w-3 h-3 text-indigo-600" />
                ENCRYPTED
              </span>
            </div>

            <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 flex items-center justify-between">
              <span>Security: <strong className="text-slate-900">FIPS 203 Post-Quantum Envelope</strong></span>
              <span className="text-emerald-700 font-medium">Authorized for you</span>
            </div>
          </div>

          {!decryptedResult ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Your Hardware Keystore Passphrase (@{currentUser})
                </label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter your security passphrase"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Authenticates your identity and unlocks your ML-KEM-768 secret key.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDecrypt}
                  disabled={loading}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{loading ? 'Verifying & Decrypting...' : 'Open Document'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Recipient Decryption Success Screen - STRICTLY CLEAN & RULE COMPLIANT */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Document Decrypted Successfully</span>
                </div>

                <div className="space-y-1.5 text-xs text-emerald-950 font-medium">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>✓ Identity verified</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>✓ Access authorized</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>✓ Document decrypted</span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800/80 leading-relaxed pt-1">
                  The document has been securely rendered. You can view or download your authentic copy below.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
