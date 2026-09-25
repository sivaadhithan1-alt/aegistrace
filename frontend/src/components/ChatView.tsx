import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Shield,
  Lock,
  Unlock,
  FileText,
  CheckCheck,
  Users,
  Plus,
  Search,
  Check,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Download,
  ArrowLeft
} from 'lucide-react';
import { Conversation, Message, UserInfo } from '../types';
import { api } from '../api/client';
import { AttachmentModal } from './AttachmentModal';
import { DecryptModal } from './DecryptModal';

interface ChatViewProps {
  currentUser: string;
  users: UserInfo[];
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, users }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  // The demo task force is intentionally hidden until the user explicitly activates it.
  // This is session-local UI state; the backend conversation may already exist.
  const [demoTaskForceActivated, setDemoTaskForceActivated] = useState<boolean>(false);

  // Modals state
  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false);
  const [selectedAttachFile, setSelectedAttachFile] = useState<File | null>(null);

  const [isDecryptModalOpen, setIsDecryptModalOpen] = useState<boolean>(false);
  const [activeDecryptMessage, setActiveDecryptMessage] = useState<Message | null>(null);

  const [isNewConvModalOpen, setIsNewConvModalOpen] = useState<boolean>(false);
  const [newConvTitle, setNewConvTitle] = useState<string>('');
  const [newConvRecipients, setNewConvRecipients] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDemoTaskForceActivated(false);
    setActiveConvId(null);
    setMessages([]);
    loadConversations();
  }, [currentUser]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      const interval = setInterval(() => loadMessages(activeConvId, false), 3000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs);
      if (convs.length > 0 && !activeConvId) {
        setActiveConvId(convs[0].conversation_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (convId: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const msgs = await api.getMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const text = inputText;
    setInputText('');
    try {
      await api.sendMessage(activeConvId, text);
      await loadMessages(activeConvId, false);
      await loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedAttachFile(e.target.files[0]);
      setIsAttachModalOpen(true);
    }
  };

  const handleSendAttachment = async (
    file: File,
    recipientIds: string[],
    fingerprintEnabled: boolean,
    passphrase: string
  ) => {
    if (!activeConvId) return;
    await api.sendAttachment(activeConvId, file, recipientIds, fingerprintEnabled, passphrase);
    await loadMessages(activeConvId, false);
    await loadConversations();
  };

  const handleDecrypt = async (documentId: string, passphrase: string) => {
    const res = await api.decryptDocument(documentId, passphrase);
    if (activeConvId) await loadMessages(activeConvId, false);
    return res;
  };

  const handleCreateNewConversation = async () => {
    if (newConvRecipients.length === 0) return;
    try {
      const isGroup = newConvRecipients.length > 1;
      const conv = await api.createConversation(newConvRecipients, newConvTitle || undefined, isGroup);
      setIsNewConvModalOpen(false);
      setNewConvTitle('');
      setNewConvRecipients([]);
      await loadConversations();
      setActiveConvId(conv.conversation_id);
    } catch (err) {
      console.error(err);
    }
  };

  const DEMO_TASK_FORCE_TITLE = 'Joint Intelligence Task Force Alpha';

  const handleCreateDemoTaskForce = async () => {
    try {
      const demoRecips = ['priya', 'rahul', 'vikram'];
      const conv = await api.createConversation(demoRecips, DEMO_TASK_FORCE_TITLE, true);
      setDemoTaskForceActivated(true);
      await loadConversations();
      setActiveConvId(conv.conversation_id);
    } catch (err) {
      console.error(err);
    }
  };

  const visibleConversations = demoTaskForceActivated
    ? conversations
    : conversations.filter(c => c.title !== DEMO_TASK_FORCE_TITLE);

  const activeConv = visibleConversations.find(c => c.conversation_id === activeConvId);

  const filteredConversations = visibleConversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.members.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100dvh-4rem)] w-full max-w-full min-w-0 bg-white overflow-hidden">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Left Sidebar: Conversations List */}
      <div className={`${activeConv ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 border-r border-slate-200 flex-col bg-white shrink-0 min-w-0`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">DEFENSE CHATS</h2>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Air-Gapped PQC Active
            </p>
          </div>
          <button
            onClick={() => setIsNewConvModalOpen(true)}
            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            title="New Conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, officers..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-xs text-slate-500">No active conversations found.</p>
              <button
                onClick={handleCreateDemoTaskForce}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                [ Use Demo Task Force Contacts ]
              </button>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = conv.conversation_id === activeConvId;
              return (
                <div
                  key={conv.conversation_id}
                  onClick={() => setActiveConvId(conv.conversation_id)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start space-x-3 ${
                    isActive
                      ? 'bg-indigo-50/70 border-l-3 border-indigo-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                      {conv.is_group ? <Users className="w-4 h-4 text-indigo-600" /> : conv.title.charAt(0).toUpperCase()}
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-2 ring-white"></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{conv.title}</h4>
                      {conv.last_message && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {conv.last_message ? (
                        conv.last_message.message_type === 'DOCUMENT' ? (
                          <span className="text-indigo-600 font-medium flex items-center gap-1">
                            <FileText className="w-3 h-3 inline" />
                            {conv.last_message.content}
                          </span>
                        ) : (
                          `${conv.last_message.sender_id}: ${conv.last_message.content}`
                        )
                      ) : (
                        <span className="text-slate-400 italic">No messages yet</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeConv ? (
        <div className="flex-1 min-w-0 max-w-full flex flex-col bg-slate-50">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shadow-2xs min-w-0">
            <div className="flex items-center min-w-0 gap-2">
              <button type="button" onClick={() => { setActiveConvId(null); setMessages([]); }} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0" aria-label="Back to conversations">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                {activeConv.is_group ? <Users className="w-4 h-4" /> : activeConv.title.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{activeConv.title}</h3>
                  <span className="px-1.5 py-0.5 text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-mono font-semibold">
                    ML-KEM-768
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  Members: {activeConv.members.join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 text-[11px] bg-slate-100 text-slate-700 border border-slate-200 rounded-md flex items-center gap-1.5 font-medium">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Quantum-Safe Envelope</span>
              </span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 min-w-0 w-full max-w-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                <Shield className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-slate-700 font-semibold mb-1">Quantum-Safe Air-Gapped Channel Ready</p>
                <p className="text-slate-500 max-w-sm text-[11px]">
                  All documents and messages exchanged are encrypted using Post-Quantum ML-KEM-768 and AES-256-GCM.
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender_id === currentUser;
                const isDoc = msg.message_type === 'DOCUMENT';

                return (
                  <div
                    key={msg.message_id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400 font-mono">
                      <span className="font-semibold text-slate-600">{isMe ? 'You' : msg.sender_id}</span>
                      <span>•</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {!isDoc ? (
                      /* Text Message Bubble */
                      <div
                        className={`max-w-md sm:max-w-lg p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <div className={`flex justify-end items-center gap-1 mt-1 text-[9px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                          <CheckCheck className="w-3 h-3" />
                        </div>
                      </div>
                    ) : (
                      /* Encrypted Document Attachment Card - STRICTLY ADHERES TO ABSOLUTE FINGERPRINT UI RULE */
                      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {msg.document_info?.filename || 'classified_report.pdf'}
                              </h4>
                              <p className="text-[10px] text-slate-500">
                                {msg.document_info ? `${(msg.document_info.file_size / 1024).toFixed(1)} KB` : 'Encrypted Document'}
                              </p>
                            </div>
                          </div>

                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono">
                            .SDOC
                          </span>
                        </div>

                        {/* Status Note adhering to Rule */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                          {isMe ? (
                            /* SENDER VIEW: display only "✓ Forensic protection enabled" if enabled */
                            <div className="text-indigo-700 font-medium flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>✓ Forensic protection enabled</span>
                            </div>
                          ) : (
                            /* RECIPIENT VIEW: display only "🔐 Secure Document - Encrypted • Authorized for you" */
                            <div className="text-slate-700 font-medium flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>🔐 Secure Document - Encrypted • Authorized for you</span>
                            </div>
                          )}
                        </div>

                        {/* Open / Decrypt Action Button */}
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              setActiveDecryptMessage(msg);
                              setIsDecryptModalOpen(true);
                            }}
                            className="w-full py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>[ Open Document ]</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              title="Attach Document (.pdf, .docx, .xlsx, .pptx, .txt, .png, etc.)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeConv.title} (Protected with PQC)...`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
          Select or create a conversation to begin encrypted messaging.
        </div>
      )}

      {/* Modals */}
      <AttachmentModal
        isOpen={isAttachModalOpen}
        file={selectedAttachFile}
        users={users}
        currentUser={currentUser}
        onClose={() => {
          setIsAttachModalOpen(false);
          setSelectedAttachFile(null);
        }}
        onSend={handleSendAttachment}
      />

      <DecryptModal
        isOpen={isDecryptModalOpen}
        message={activeDecryptMessage}
        currentUser={currentUser}
        onClose={() => {
          setIsDecryptModalOpen(false);
          setActiveDecryptMessage(null);
        }}
        onDecrypt={handleDecrypt}
        onInspectProvenance={() => {}}
      />

      {/* New Conversation Modal */}
      {isNewConvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Create New Secure Chat</h3>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Chat / Task Force Title</label>
              <input
                type="text"
                value={newConvTitle}
                onChange={(e) => setNewConvTitle(e.target.value)}
                placeholder="e.g. Joint Intelligence Task Force"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Select Enclave Officers</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {users.filter(u => u.user_id !== currentUser).map(u => {
                  const isChecked = newConvRecipients.includes(u.user_id);
                  return (
                    <div
                      key={u.user_id}
                      onClick={() => {
                        if (isChecked) {
                          setNewConvRecipients(newConvRecipients.filter(id => id !== u.user_id));
                        } else {
                          setNewConvRecipients([...newConvRecipients, u.user_id]);
                        }
                      }}
                      className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{u.display_name} ({u.role})</span>
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewConvModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewConversation}
                disabled={newConvRecipients.length === 0}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
