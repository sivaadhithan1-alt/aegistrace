import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  Cpu,
  FileText,
  Key,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserInfo } from '../types';
import { api } from '../api/client';

interface EncryptionLabViewProps {
  users: UserInfo[];
  currentUser: string;
}

export const EncryptionLabView: React.FC<EncryptionLabViewProps> = ({ users, currentUser }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(
    users.filter(u => u.user_id !== currentUser).map(u => u.user_id)
  );
  const [passphrase, setPassphrase] = useState<string>(
    ['arjun', 'priya', 'rahul', 'vikram', 'meera', 'auditor', 'admin'].includes(currentUser)
      ? `${currentUser}_secret`
      : `${currentUser}123`
  );
  const [fingerprintEnabled, setFingerprintEnabled] = useState<boolean>(true);
  const [encryptionResult, setEncryptionResult] = useState<any | null>(null);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRecipient = (uid: string) => {
    if (selectedRecipients.includes(uid)) {
      setSelectedRecipients(selectedRecipients.filter(id => id !== uid));
    } else {
      setSelectedRecipients([...selectedRecipients, uid]);
    }
  };

  const handleEncrypt = async () => {
    if (!selectedFile) {
      setError('Please select a document file to encapsulate.');
      return;
    }
    if (selectedRecipients.length === 0) {
      setError('Select at least one authorized recipient.');
      return;
    }

    setError(null);
    setIsEncrypting(true);
    try {
      // Create a temporary conversation or use attachment endpoint
      const convs = await api.getConversations();
      let convId = convs.length > 0 ? convs[0].conversation_id : null;
      if (!convId) {
        const newConv = await api.createConversation(selectedRecipients, 'Lab Encryption Session', true);
        convId = newConv.conversation_id;
      }

      const res = await api.sendAttachment(
        convId,
        selectedFile,
        selectedRecipients,
        fingerprintEnabled,
        passphrase
      );
      setEncryptionResult(res);
    } catch (e: any) {
      setError(e.message || 'Encryption failed.');
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          PQC Multi-Recipient Encryption & Decryption Lab
        </h2>
        <p className="text-xs text-slate-500">
          Interactive testbed for FIPS 203 ML-KEM-768 key encapsulation and authenticated .SDOC packaging
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>Encapsulate Document (.SDOC Package)</span>
          </h3>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* File Upload Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Document
            </label>
            <input
              type="file"
              onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
            />
            {selectedFile && (
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Forensic Protection Switch */}
          <div className="p-3.5 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center justify-between">
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
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Recipient Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Authorized Recipients ({selectedRecipients.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {users.map(u => {
                const isChecked = selectedRecipients.includes(u.user_id);
                return (
                  <div
                    key={u.user_id}
                    onClick={() => toggleRecipient(u.user_id)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isChecked
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-[11px]">{u.display_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">@{u.user_id}</div>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                      {isChecked && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sender Passphrase */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Sender Keystore Passphrase (@{currentUser})
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <button
            onClick={handleEncrypt}
            disabled={isEncrypting || !selectedFile}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isEncrypting ? 'Encapsulating DEK with ML-KEM-768...' : 'Generate .SDOC Package'}
          </button>
        </div>

        {/* Right Column: Encapsulation Manifest & Details (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>PQC Cryptographic Manifest</span>
          </h3>

          {!encryptionResult ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs space-y-2">
              <Shield className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Configure and encrypt a file to view the resulting post-quantum manifest.</p>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1 text-emerald-950">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Envelope Packaging Succeeded</span>
                </div>
                <div className="text-[11px] font-mono">
                  Container: {encryptionResult.document?.document_id || 'DOC-READY'}.sdoc
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cipher:</span>
                  <span className="font-semibold text-slate-900">AES-256-GCM (256-bit DEK)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Key Encapsulation:</span>
                  <span className="font-semibold text-indigo-600">ML-KEM-768</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sender Signature:</span>
                  <span className="font-semibold text-indigo-600">ML-DSA-65</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipients Sealed:</span>
                  <span className="font-semibold text-slate-900">{selectedRecipients.length} Keys</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                The generated package contains independent ML-KEM-768 ciphertexts for each recipient wrapping the symmetric key.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
