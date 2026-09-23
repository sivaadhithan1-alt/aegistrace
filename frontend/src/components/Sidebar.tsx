import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FileText,
  ShieldCheck,
  Lock,
  Database,
  Search,
  Key,
  Activity,
  Settings,
  PlayCircle,
  Shield,
  ChevronDown,
  Radio,
  Cpu
} from 'lucide-react';
import { UserInfo } from '../types';

export type PageId =
  | 'dashboard'
  | 'chats'
  | 'contacts'
  | 'documents'
  | 'security'
  | 'encryption'
  | 'ledger'
  | 'forensics'
  | 'identity'
  | 'system'
  | 'settings'
  | 'demo';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  currentUser: string;
  users: UserInfo[];
  onSelectUser: (userId: string) => void;
  isDemoActive?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

type PersonaOption = Pick<UserInfo, 'user_id' | 'display_name' | 'role'>;

// Keep demo personas available immediately while the backend hydrates.
const FALLBACK_PERSONAS: PersonaOption[] = [
  { user_id: 'arjun', display_name: 'Officer Arjun', role: 'Sender' },
  { user_id: 'priya', display_name: 'Officer Priya', role: 'Operations' },
  { user_id: 'rahul', display_name: 'Officer Rahul', role: 'Field Ops' },
  { user_id: 'vikram', display_name: 'Officer Vikram', role: 'Intelligence' },
  { user_id: 'meera', display_name: 'Officer Meera', role: 'Forensic Officer' },
  { user_id: 'auditor', display_name: 'Security Auditor', role: 'Auditor' },
  { user_id: 'admin', display_name: 'Security Chief', role: 'Admin' }
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  currentUser,
  users,
  onSelectUser,
  isDemoActive = false,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'chats', label: 'Chats & Comms', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'contacts', label: 'Enclave Contacts', icon: <Users className="w-4 h-4" /> },
    { id: 'documents', label: 'Document Center', icon: <FileText className="w-4 h-4" /> },
    { id: 'security', label: 'Security Center', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'encryption', label: 'PQC Encrypt / Decrypt', icon: <Lock className="w-4 h-4" /> },
    { id: 'ledger', label: 'Audit Ledger (DLT)', icon: <Database className="w-4 h-4" /> },
    { id: 'forensics', label: 'Forensic Lab', icon: <Search className="w-4 h-4" /> },
    { id: 'identity', label: 'Identity & PKI Keys', icon: <Key className="w-4 h-4" /> },
    { id: 'system', label: 'System Status', icon: <Activity className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Policy', icon: <Settings className="w-4 h-4" /> },
    { id: 'demo', label: 'SIH Judge Demo', icon: <PlayCircle className="w-4 h-4" />, badge: 'EVAL' },
  ];

  const personaOptions: PersonaOption[] = users.length > 0
    ? users.map(({ user_id, display_name, role }) => ({ user_id, display_name, role }))
    : FALLBACK_PERSONAS;

  const currentProfile = users.find(u => u.user_id === currentUser);
  const fallbackProfile = FALLBACK_PERSONAS.find(u => u.user_id === currentUser);
  const activeProfile = currentProfile || fallbackProfile;

  return (
    <>
      {isMobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 select-none shadow-xl transition-transform duration-200 md:static md:z-auto md:w-64 md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      {/* Brand & Logo */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-100">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight leading-none text-base">AegisTrace</div>
            <div className="text-[10px] text-indigo-600 font-semibold tracking-wider uppercase mt-1">PQC Enclave v2.4</div>
          </div>
        </div>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      {/* Active Persona Switcher */}
      <div className="px-3 py-3 border-b border-slate-100 bg-slate-50/70">
        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 px-1">
          Active Officer Persona
        </label>
        <div className="relative">
          <select
            value={currentUser}
            onChange={(e) => onSelectUser(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-2 pr-7 font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            {personaOptions.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.display_name} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {activeProfile && (
          <div className="mt-2 flex items-center justify-between text-[11px] px-1 text-slate-600">
            <span className="truncate">Role: <span className="font-medium text-slate-900">{activeProfile.role}</span></span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              L5 CLEARANCE
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Defense Enclave Navigation
        </div>
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs border border-indigo-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Air-gap / Crypto Badge Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center space-x-1.5 font-medium text-emerald-700">
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>Air-Gapped (Zero Cloud)</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <div className="bg-white p-2 rounded-md border border-slate-200 text-[10px] text-slate-500 font-mono space-y-0.5">
          <div className="flex justify-between">
            <span>KEM:</span>
            <span className="font-semibold text-indigo-600">ML-KEM-768</span>
          </div>
          <div className="flex justify-between">
            <span>SIG:</span>
            <span className="font-semibold text-indigo-600">ML-DSA-65</span>
          </div>
          <div className="flex justify-between">
            <span>LEDGER:</span>
            <span className="font-semibold text-emerald-600">5-Node BFT</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
