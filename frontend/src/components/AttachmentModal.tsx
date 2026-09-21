import React, { useState } from 'react';
import { Shield, FileText, Check, X, AlertTriangle, Lock, Users, Sparkles } from 'lucide-react';
import { UserInfo } from '../types';

interface AttachmentModalProps {
  isOpen: boolean;
  file: File | null;
  users: UserInfo[];
  currentUser: string;
  onClose: () => void;
  onSend: (file: File, recipientIds: string[], fingerprintEnabled: boolean, passphrase: string) => Promise<void>;
}

export const AttachmentModal: React.FC<AttachmentModalProps> = ({
  isOpen,
  file,
  users,
  currentUser,
  onClose,
  onSend
}) => {
  if (!isOpen || !file) return null;

  const [fingerprintEnabled, setFingerprintEnabled] = useState<boolean>(true);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(
    users.filter(u => u.user_id !== currentUser && ['recipient', 'sender'].includes(u.role)).map(u => u.user_id)
  );
  const [passphrase, setPassphrase] = useState<string>(
    ['arjun', 'priya', 'rahul', 'vikram', 'meera', 'auditor', 'admin'].includes(currentUser)
      ? `${currentUser}_secret`
      : `${currentUser}123`
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRecipient = (userId: string) => {
    if (selectedRecipients.includes(userId)) {
      setSelectedRecipients(selectedRecipients.filter(id => id !== userId));
    } else {
      setSelectedRecipients([...selectedRecipients, userId]);
    }
  };

  const handleConfirm = async () => {
    if (selectedRecipients.length === 0) {
      setError('Please select at least one authorized recipient.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSend(file, selectedRecipients, fingerprintEnabled, passphrase);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Encryption and distribution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transmit Encrypted Document</h3>
              <p className="text-xs text-slate-500">Post-Quantum Envelope Encryption (.SDOC)</p>
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

          {/* Document Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-xs text-slate-900">{file.name}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-2">
              <span className="font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                AES-256-GCM + ML-KEM-768
              </span>
              <span>•</span>
              <span className="text-slate-500">Defense Container Standard</span>
            </div>
          </div>

          {/* Forensic Protection Toggle - STRICT USER REQUIREMENT */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Forensic Protection</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  The document will remain visually unchanged to recipients
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fingerprintEnabled}
                  onChange={(e) => setFingerprintEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {fingerprintEnabled && (
              <div className="text-[11px] text-indigo-700 font-medium flex items-center gap-1 pt-1">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>✓ Forensic protection enabled</span>
              </div>
            )}
          </div>

          {/* Recipient Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Select Authorized Recipients ({selectedRecipients.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">ML-KEM Key Wrappers</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {users
                .filter(u => u.user_id !== currentUser && ['recipient', 'sender'].includes(u.role))
                .map(u => {
                  const isChecked = selectedRecipients.includes(u.user_id);
                  return (
                    <div
                      key={u.user_id}
                      onClick={() => toggleRecipient(u.user_id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-indigo-50/70 border-indigo-300 text-slate-900 font-medium shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{u.display_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">@{u.user_id}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Passphrase */}
          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Sender Signing Keystore Passphrase
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter sender passphrase"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Unlocks sender ML-DSA-65 private key to digitally sign container manifest.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            <span>{loading ? 'Encrypting & Sealing...' : 'Encrypt & Send'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
