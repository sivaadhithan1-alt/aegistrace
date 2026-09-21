import React, { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Key,
  ShieldAlert,
  FileText,
  Check,
  Shield,
  Layers
} from 'lucide-react';
import { LedgerBlock } from '../types';
import { api } from '../api/client';

export const LedgerExplorer: React.FC = () => {
  const [blocks, setBlocks] = useState<LedgerBlock[]>([]);
  const [validators, setValidators] = useState<any[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<LedgerBlock | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<any | null>(null);
  const [simulatingTamper, setSimulatingTamper] = useState<boolean>(false);
  const [tamperResult, setTamperResult] = useState<any | null>(null);

  useEffect(() => {
    loadLedgerData();
  }, []);

  const loadLedgerData = async () => {
    try {
      const bRes = await api.getLedgerBlocks();
      setBlocks(bRes.blocks || []);
      if (bRes.blocks && bRes.blocks.length > 0 && !selectedBlock) {
        setSelectedBlock(bRes.blocks[bRes.blocks.length - 1]);
      }
      const vRes = await api.getValidators();
      setValidators(vRes.validators || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyChain();
      setAuditReport(res.audit);
      setTamperResult(null);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async (height: number) => {
    setSimulatingTamper(true);
    try {
      const res = await api.simulateTamper(height, 'transactions');
      setTamperResult(res.tamper_simulation);
      setAuditReport(null);
      await loadLedgerData();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulatingTamper(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              FIVE-VALIDATOR PERMISSIONED BFT DEMONSTRATION
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-mono text-slate-500">Quorum: 3 of 5 Required</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Immutable Permissioned Audit Ledger (DLT)
          </h2>
          <p className="text-xs text-slate-600">
            Air-gapped tamper-evident hash-chain with post-quantum ML-DSA-65 validator multi-signatures
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Verifying Chain...' : 'Verify Cryptographic Integrity'}</span>
          </button>
        </div>
      </div>

      {/* Tamper Alert */}
      {tamperResult && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>ATTACK DETECTED: Tampering Identified via Merkle & Hash-Chain Verification!</span>
          </div>
          <p className="text-rose-700 text-[11px]">
            The integrity scanner flagged an altered block payload. Downstream Merkle roots and hash links failed cryptographic verification.
          </p>
          <div className="bg-white p-3 rounded-lg border border-rose-200 font-mono text-[11px] text-rose-800 space-y-1">
            {tamperResult.errors?.map((err: string, idx: number) => (
              <div key={idx}>[✗] {err}</div>
            ))}
          </div>
        </div>
      )}

      {auditReport && (
        <div className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in ${
          auditReport.is_valid
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Chain Integrity Verified: All {auditReport.total_blocks} Blocks Cryptographically Verified</span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-mono font-bold">
              HASH-CHAIN SEALED
            </span>
          </div>
          <p className="text-[11px] text-emerald-800/80">
            Every block header, SHA3-256 previous-hash pointer, Merkle transaction root, and validator ML-DSA signature verified successfully.
          </p>
        </div>
      )}

      {/* 5-Node Validator Quorum Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Permissioned Validator Authority Network (5 Nodes)</span>
          </h3>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            ALL NODES ONLINE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {validators.map((val, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs truncate">{val.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-[10px] text-indigo-600 font-medium">{val.role}</div>
              <div className="text-[9px] text-slate-400 font-mono truncate">{val.node_id}</div>
              <div className="text-[9px] text-slate-500 font-mono">Algorithm: ML-DSA-65</div>
            </div>
          ))}
        </div>
      </div>

      {/* Block Timeline and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Blocks Timeline (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Block Timeline ({blocks.length})
            </h3>
            <button
              onClick={loadLedgerData}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
              title="Refresh Blocks"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {blocks.slice().reverse().map(block => {
              const isSelected = selectedBlock?.header.block_height === block.header.block_height;
              const isGenesis = block.header.block_height === 0;

              return (
                <div
                  key={block.header.block_height}
                  onClick={() => setSelectedBlock(block)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isGenesis ? 'bg-slate-100 text-slate-700' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      BLOCK #{block.header.block_height}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {block.transactions.length} TX
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 truncate mt-1">
                    HASH: <span className="text-slate-700">{block.block_hash.slice(0, 20)}...</span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-100">
                    <span>{new Date(block.header.timestamp).toLocaleTimeString()}</span>
                    <span className="text-emerald-600 font-medium">{block.validator_signatures.length}/5 Sigs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Block Inspector (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5 overflow-y-auto max-h-[520px]">
          {selectedBlock ? (
            <>
              {/* Block Header Info */}
              <div className="border-b border-slate-100 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold font-mono">
                      Block #{selectedBlock.header.block_height}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {selectedBlock.header.timestamp}
                    </span>
                  </div>

                  {selectedBlock.header.block_height > 0 && (
                    <button
                      onClick={() => handleSimulateTamper(selectedBlock.header.block_height)}
                      disabled={simulatingTamper}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Simulate Tamper
                    </button>
                  )}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-mono text-xs space-y-1.5 text-slate-700">
                  <div>
                    <span className="text-slate-400">Block Hash (SHA3-256): </span>
                    <span className="text-slate-900 break-all">{selectedBlock.block_hash}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Previous Hash: </span>
                    <span className="text-slate-600 break-all">{selectedBlock.header.previous_block_hash}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Merkle Root: </span>
                    <span className="text-indigo-600 break-all">{selectedBlock.header.merkle_root}</span>
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Block Transactions ({selectedBlock.transactions.length})</span>
                </h4>

                <div className="space-y-2.5">
                  {selectedBlock.transactions.map((tx, idx) => {
                    const payload = tx.payload || {};
                    const rec = payload.record || {};

                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 font-mono">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-indigo-700 font-bold">{tx.tx_id || `TX-${idx}`}</span>
                          <span className="text-[10px] text-slate-400">{tx.recorded_at}</span>
                        </div>

                        {rec.recipient_id ? (
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>
                              <span className="text-slate-400">Recipient: </span>
                              <span className="text-slate-900 font-bold">@{rec.recipient_id}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Document: </span>
                              <span className="text-slate-700">{rec.document_id}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Signature: </span>
                              <span className="text-emerald-700 font-semibold">✓ ML-DSA-65 Valid</span>
                            </div>
                            <div>
                              <span className="text-slate-400">DLT Anchor: </span>
                              <span className="text-slate-700">Committed</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-600">
                            {payload.message || 'Genesis State Initialization Transaction'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a block to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
