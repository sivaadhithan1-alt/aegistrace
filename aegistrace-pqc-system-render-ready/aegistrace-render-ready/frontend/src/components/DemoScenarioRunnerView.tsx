import React, { useState } from 'react';
import {
  PlayCircle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Lock,
  Unlock,
  Shield,
  FileText,
  Search,
  Database,
  ArrowRight,
  Code2,
  Check,
  ChevronRight,
  Cpu,
  Layers,
  AlertTriangle,
  Loader2,
  Info,
  ShieldAlert,
  Server,
  Award,
  Maximize2
} from 'lucide-react';
import { PageId } from './Sidebar';
import { DEMO_STEPS, DemoStepMetadata } from './FloatingDemoCard';

interface DemoScenarioRunnerViewProps {
  currentStep: number;
  completedSteps: number[];
  isDemoActive?: boolean;
  onLaunchDemo: () => void;
  onSelectStep: (stepNum: number, targetPage: PageId) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onRunFullScenario: () => Promise<void>;
  isLoading?: boolean;
}

export const DemoScenarioRunnerView: React.FC<DemoScenarioRunnerViewProps> = ({
  currentStep,
  completedSteps,
  isDemoActive = false,
  onLaunchDemo,
  onSelectStep,
  onResetDemo,
  onRunFullScenario,
  isLoading = false
}) => {
  const [activeStepDetails, setActiveStepDetails] = useState<number>(1);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(true);

  const selectedMetadata = DEMO_STEPS.find(s => s.step === activeStepDetails) || DEMO_STEPS[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              SMART INDIA HACKATHON EVALUATION SUITE
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-mono text-slate-500">12-Step Guided Defense Evaluation</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            AegisTrace Post-Quantum Provenance & Forensic Defense Walkthrough
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl">
            Experience end-to-end post-quantum document distribution, dynamic covert steganography, 5-validator BFT DLT anchoring, and zero-knowledge leak attribution.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={onResetDemo}
            disabled={isLoading}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={onLaunchDemo}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Launch 12-Step Judge Demo</span>
          </button>

          <button
            onClick={onRunFullScenario}
            disabled={isLoading}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 text-emerald-400" />
                <span>Run All 12 Steps</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress & Overview Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">
            Evaluation Progress: {completedSteps.length} / 12 Steps Completed
          </span>
          <div className="flex items-center space-x-3">
            {isDemoActive && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Judge Walkthrough Active (Step {currentStep || 1}/12)
              </span>
            )}
            <span className="font-mono text-indigo-600 font-semibold">
              {Math.round((completedSteps.length / 12) * 100)}%
            </span>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedSteps.length / 12) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 12 Steps Interactive Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2.5 flex flex-col h-[620px]">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider shrink-0 pb-1 border-b border-slate-100">
            Scenario Step Timeline
          </h3>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {DEMO_STEPS.map((s) => {
              const isCompleted = completedSteps.includes(s.step);
              const isCurrent = currentStep === s.step;
              const isSelected = activeStepDetails === s.step;

              return (
                <div
                  key={s.step}
                  onClick={() => setActiveStepDetails(s.step)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.step}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate text-[11px]">{s.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Page: {s.target_page.toUpperCase()}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStep(s.step, s.target_page);
                    }}
                    disabled={isLoading}
                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[10px] font-semibold rounded shadow-2xs shrink-0 cursor-pointer"
                  >
                    Run Step
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Step Detail Panel (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 overflow-y-auto max-h-[620px]">
          <div>
            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              TARGET VIEW: {selectedMetadata.target_page.toUpperCase()} — STEP {selectedMetadata.step} OF 12
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {selectedMetadata.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {selectedMetadata.summary}
            </p>
          </div>

          {/* Why This Matters Callout */}
          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/70 space-y-1">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Operational Relevance & Why This Matters</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              {selectedMetadata.why_this_matters}
            </p>
          </div>

          {/* Technical Details */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span>Cryptographic & Protocol Specifications</span>
              </h4>
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                {showTechnicalDetails ? 'Hide' : 'Show'}
              </button>
            </div>

            {showTechnicalDetails && (
              <div className="space-y-2 text-xs font-mono text-slate-700">
                {Object.entries(selectedMetadata.technical_details).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-start gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 shrink-0 font-medium">{k}:</span>
                    <span className="font-semibold text-slate-900 text-right">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Executes the cryptographic routines and navigates to the target page.
            </span>

            <button
              onClick={() => onSelectStep(selectedMetadata.step, selectedMetadata.target_page)}
              disabled={isLoading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Execute Step #{selectedMetadata.step}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
