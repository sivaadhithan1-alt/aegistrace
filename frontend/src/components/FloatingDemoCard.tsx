import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Code2,
  CheckCircle2,
  Loader2,
  Info,
  X,
  Check
} from 'lucide-react';
import { PageId } from './Sidebar';

export interface DemoStepMetadata {
  step: number;
  target_page: PageId;
  title: string;
  summary: string;
  why_this_matters: string;
  technical_details: Record<string, any>;
}

export const DEMO_STEPS: DemoStepMetadata[] = [
  {
    step: 1,
    target_page: 'dashboard',
    title: '1. The Classified Data Leak Problem',
    summary: 'Traditional end-to-end encrypted sharing protects data in transit, but once decrypted, confidentiality terminates. Leaked copies cannot be proven without cryptographic provenance.',
    why_this_matters: 'In defense and classified operations, establishing non-repudiable accountability after decryption is just as vital as pre-decryption confidentiality.',
    technical_details: {
      'Core Vulnerability': 'Loss of cryptographic provenance post-decryption',
      'Classical Limitation': 'Standard encryption has no recipient-bound forensic anchoring',
      'Operational Need': 'Cryptographically provable chain of custody for every decrypted instance'
    }
  },
  {
    step: 2,
    target_page: 'security',
    title: '2. AegisTrace Post-Quantum Architecture',
    summary: 'AegisTrace unifies Post-Quantum Cryptography (FIPS 203/204), covert dynamic steganography, and permissioned DLT into a unified zero-knowledge provenance engine.',
    why_this_matters: 'Provides quantum-resistant confidentiality alongside tamper-proof forensic accountability in 100% air-gapped environments.',
    technical_details: {
      'Key Encapsulation': 'NIST FIPS 203 ML-KEM-768',
      'Digital Signature': 'NIST FIPS 204 ML-DSA-65',
      'Symmetric AEAD': 'AES-256-GCM (Authenticated Encryption)',
      'Forensic Anchor': '5-Validator Byzantine Fault Tolerant DLT'
    }
  },
  {
    step: 3,
    target_page: 'chats',
    title: '3. Sender Staging & Forensic Protection Activation',
    summary: 'Officer Arjun selects recipients (Priya, Rahul, Vikram), attaches SIH_Classified_Project_Report.pdf, and toggles Forensic Protection [ON].',
    why_this_matters: 'Forensic protection is enabled at transmission time while keeping raw fingerprint identifiers strictly secret from the sender.',
    technical_details: {
      'Sender': 'Officer Arjun (Joint Cyber Defense Directorate)',
      'Authorized Recipients': 'Officer Priya, Officer Rahul, Officer Vikram',
      'Forensic Toggle': 'Enabled (Covert Dynamic Provenance Mode)',
      'UI Privacy Rule': 'Raw fingerprint IDs, hashes, and nonces never exposed'
    }
  },
  {
    step: 4,
    target_page: 'documents',
    title: '4. Multi-Recipient PQC Envelope Encryption (.SDOC)',
    summary: 'A single AES-256-GCM ciphertext is encapsulated with independent ML-KEM-768 wrappers for each recipient into an offline .SDOC package.',
    why_this_matters: 'Eliminates cloud key managers and external dependencies; distribution occurs safely across air-gapped networks.',
    technical_details: {
      'Package Format': '.SDOC (Self-Contained Multi-Recipient Envelope)',
      'Ciphertext Cipher': 'AES-256-GCM (256-bit Document Encryption Key)',
      'Sender Non-Repudiation': 'ML-DSA-65 Signature over Manifest',
      'Recipient Wrappers': '3 Unique ML-KEM-768 Shared Secret Encapsulations'
    }
  },
  {
    step: 5,
    target_page: 'encryption',
    title: '5. Decryption & Dynamic Forensic Embedding',
    summary: 'When an authorized recipient unlocks the document, the engine decapsulates ML-KEM, derives a unique forensic marker, and signs the DecryptionRecord.',
    why_this_matters: 'Every recipient receives a uniquely watermarked instance designed to preserve normal visual appearance under standard viewing.',
    technical_details: {
      'Decapsulation': 'Recipient ML-KEM-768 Secret Key Decapsulation',
      'Watermark Encryption': 'AES-256-GCM Authenticated Encryption of Payload',
      'Steganography': 'Multi-layer Covert Format-Specific Embedding',
      'Recipient Signature': 'ML-DSA-65 Hardware/Local Key Signature'
    }
  },
  {
    step: 6,
    target_page: 'ledger',
    title: '6. 5-Validator BFT DLT Provenance Commitment',
    summary: 'The recipient signed DecryptionRecord is verified across the 5-validator permissioned BFT demonstration network and committed into a Merkle-anchored DLT block.',
    why_this_matters: 'Creates an immutable, tamper-evident record of who accessed the document without leaking the plaintext payload.',
    technical_details: {
      'Consensus': 'BFT Proof-of-Authority Demonstration (5 Logical Validators)',
      'Quorum Threshold': '≥ 3 of 5 ML-DSA-65 Validator Multi-Signatures',
      'Block Integrity': 'SHA3-256 Merkle Tree Root Hash',
      'Status': '✓ Forensic commitment recorded to immutable ledger'
    }
  },
  {
    step: 7,
    target_page: 'forensics',
    title: '7. Simulated Leak: Recipient Copy Exfiltration',
    summary: 'A simulated leak scenario: Officer Rahul decrypted copy is exfiltrated and submitted to the Forensic Lab for provenance investigation.',
    why_this_matters: 'Demonstrates realistic adversarial conditions where classified files escape authorized containment.',
    technical_details: {
      'Demonstration Mode': 'SIMULATED ADVERSARIAL LEAK',
      'Source Copy': 'Officer Rahul Decrypted Instance',
      'Investigator': 'Forensic Officer Dr. Meera',
      'Suspect File': 'classified_report_LEAKED_SAMPLE.pdf'
    }
  },
  {
    step: 8,
    target_page: 'forensics',
    title: '8. Covert Watermark Extraction & Authentication',
    summary: 'The forensic engine scans the suspect file, extracts the covert binary container, and verifies the AES-256-GCM authentication tag.',
    why_this_matters: 'Ensures only authentic AegisTrace watermarks can be decrypted, preventing false flag attacks or corrupted evidence.',
    technical_details: {
      'Extraction Method': 'Multi-Layer PDF Catalog & Trailer Steganography',
      'Payload Verification': 'AES-256-GCM Authentication Tag (Fail-Closed)',
      'Watermark Status': '✓ Authenticated Covert Watermark Detected'
    }
  },
  {
    step: 9,
    target_page: 'forensics',
    title: '9. 7-Point Fail-Closed Cryptographic Attribution',
    summary: 'The engine cross-references the immutable DLT, validates the Merkle proof, and verifies Officer Rahul ML-DSA-65 digital signature.',
    why_this_matters: 'Attribution is established through mathematical proof rather than heuristic guesswork, with complete non-repudiation.',
    technical_details: {
      'Attributed Recipient': 'Officer Rahul (Field Operations)',
      'Decryption Event': 'Verified on Ledger Block #2',
      'ML-DSA-65 Signature': 'VALID (Mathematical Proof)',
      'Merkle Inclusion': 'VALID (Cryptographically Anchored)'
    }
  },
  {
    step: 10,
    target_page: 'security',
    title: '10. Post-Quantum Security Stack & Preflight',
    summary: 'Deep-dive into the FIPS 203 & 204 cryptographic implementation, key management, and automated preflight diagnostics.',
    why_this_matters: 'Guarantees the system is strictly resilient against both classical supercomputers and future quantum cryptanalytic attacks.',
    technical_details: {
      'KEM': 'ML-KEM-768 (NIST FIPS 203) - 128-bit Post-Quantum Security',
      'Signature': 'ML-DSA-65 (NIST FIPS 204) - EUF-CMA Secure',
      'Preflight Diagnostics': '✓ ML-KEM-768 Healthy | ✓ ML-DSA-65 Healthy'
    }
  },
  {
    step: 11,
    target_page: 'system',
    title: '11. Threat Model & Adversarial Defense Matrix',
    summary: 'Evaluation of defense mechanisms against stolen envelopes, tampered watermarks, insider framing, and malicious validators.',
    why_this_matters: 'Demonstrates robust fail-closed security across all major attack vectors in high-stakes defense deployments.',
    technical_details: {
      'Watermark Tampering': 'Blocked via AES-256-GCM Auth Tag (Fails Closed)',
      'Ledger Tampering': 'Prevented by 5-Node BFT Merkle Proof Chain',
      'False Attribution': 'Cryptographically Prevented via Recipient ML-DSA-65 Private Key Signature'
    }
  },
  {
    step: 12,
    target_page: 'dashboard',
    title: '12. Executive Summary & Production Deliverables',
    summary: 'End-to-end verification completed: Confidential Document Sharing + Post-Quantum Cryptographic Accountability in 100% air-gapped defense networks.',
    why_this_matters: 'Ready for operational deployment in defense headquarters, classified research labs, and secure government enclaves.',
    technical_details: {
      'Status': 'Secure by design. Offline by architecture. Forensically attributable.',
      'Deployment': 'Self-Contained Offline Appliance / Zero Cloud',
      'Audit Verdict': '100% Cryptographic Integrity & Provenance Compliance'
    }
  }
];

interface FloatingDemoCardProps {
  isOpen: boolean;
  currentStep: number;
  onSelectStep: (stepNum: number, targetPage: PageId) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onNavigatePage: (page: PageId) => void;
  onClose: () => void;
  onComplete: () => void;
  isLoading?: boolean;
}

export const FloatingDemoCard: React.FC<FloatingDemoCardProps> = ({
  isOpen,
  currentStep,
  onSelectStep,
  onResetDemo,
  onNavigatePage,
  onClose,
  onComplete,
  isLoading = false
}) => {
  const [minimized, setMinimized] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  useEffect(() => {
    if (currentStep > 0 && currentStep <= 12) {
      setActiveStep(currentStep);
    }
  }, [currentStep]);

  if (!isOpen) return null;

  const stepIndex = Math.max(0, Math.min(activeStep - 1, DEMO_STEPS.length - 1));
  const currentMetadata = DEMO_STEPS[stepIndex];
  const progressPercent = ((stepIndex + 1) / DEMO_STEPS.length) * 100;
  const isFinalStep = stepIndex === DEMO_STEPS.length - 1;

  const handleNext = async () => {
    if (isFinalStep) {
      onComplete();
    } else {
      const nextStepNum = stepIndex + 2;
      setActiveStep(nextStepNum);
      const nextMeta = DEMO_STEPS[nextStepNum - 1];
      onNavigatePage(nextMeta.target_page);
      try {
        await onSelectStep(nextStepNum, nextMeta.target_page);
      } catch (e) {
        onNavigatePage(nextMeta.target_page);
      }
    }
  };

  const handlePrev = async () => {
    if (stepIndex > 0) {
      const prevStepNum = stepIndex;
      setActiveStep(prevStepNum);
      const prevMeta = DEMO_STEPS[prevStepNum - 1];
      onNavigatePage(prevMeta.target_page);
      try {
        await onSelectStep(prevStepNum, prevMeta.target_page);
      } catch (e) {
        onNavigatePage(prevMeta.target_page);
      }
    }
  };

  if (minimized) {
    return (
      <aside aria-label="Demo Controller" className="fixed bottom-5 right-5 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center space-x-3 cursor-pointer hover:bg-indigo-700 transition-all border border-indigo-400">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center space-x-2 text-xs font-semibold focus:outline-none cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>SIH Judge Demo: Step {stepIndex + 1}/12</span>
          <Maximize2 className="w-3.5 h-3.5 ml-1" />
        </button>
        <button
          onClick={onClose}
          className="p-1 text-indigo-200 hover:text-white rounded hover:bg-indigo-800 transition-colors cursor-pointer"
          title="Exit Demo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  return (
    <aside aria-label="Demo Controller" className="fixed bottom-5 right-5 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-indigo-200 overflow-hidden flex flex-col transition-all animate-in fade-in slide-in-from-bottom-4 duration-150">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight">SIH Judge Evaluation Demo</div>
            <div className="text-[10px] text-indigo-300 font-mono">Step {stepIndex + 1} of 12</div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onResetDemo()}
            title="Reset Demo State"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMinimized(true)}
            title="Minimize Card"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close / Exit Judge Demo"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5">
        <div
          className="bg-indigo-600 h-1.5 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
        <div>
          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-1.5">
            STEP {stepIndex + 1} / 12 — {currentMetadata.target_page.toUpperCase()} VIEW
          </div>
          <h4 className="text-sm font-bold text-slate-900 leading-snug">
            {currentMetadata.title}
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {currentMetadata.summary}
          </p>
        </div>

        {/* Why this matters Section */}
        <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200/60 space-y-1">
          <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Why this matters</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {currentMetadata.why_this_matters}
          </p>
        </div>

        {/* Technical Details Toggle */}
        <div className="border-t border-slate-100 pt-2">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center justify-between w-full text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5" />
              Technical & Cryptographic Specs
            </span>
            <span className="text-xs">{showTechnicalDetails ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {showTechnicalDetails && (
            <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-mono space-y-1 text-slate-700">
              {Object.entries(currentMetadata.technical_details).map(([k, v]) => (
                <div key={k} className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 shrink-0">{k}:</span>
                  <span className="font-semibold text-slate-900 text-right">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-slate-50 border-t border-slate-200 p-3 flex items-center justify-between gap-2">
        <button
          onClick={handlePrev}
          disabled={stepIndex === 0}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <div className="text-[11px] font-medium text-slate-500 font-mono">
          {stepIndex + 1} / 12
        </div>

        <button
          onClick={handleNext}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs flex items-center space-x-1 cursor-pointer transition-colors ${
            isFinalStep
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isFinalStep ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Complete & Close Demo</span>
            </>
          ) : (
            <>
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
