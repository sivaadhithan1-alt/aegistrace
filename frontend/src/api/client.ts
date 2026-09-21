import { UserInfo, Conversation, Message, LedgerBlock, ForensicAnalysisResult, SystemHealth } from '../types';

export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiClient {
  private currentUserId: string = 'arjun';

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
  }

  getCurrentUser(): string {
    return this.currentUserId;
  }

  private getHeaders(extra: HeadersInit = {}): HeadersInit {
    return {
      'X-User-Id': this.currentUserId,
      ...extra
    };
  }

  // Auth & Users
  async listUsers(): Promise<UserInfo[]> {
    const res = await fetch(`${API_BASE}/auth/users`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    return data.users;
  }

  async login(userId: string, password: string): Promise<UserInfo> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    this.currentUserId = userId;
    return data.user;
  }

  async registerUser(userData: { user_id: string; display_name: string; role: string; password: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return await res.json();
  }

  async getCRL(): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/crl`);
    if (!res.ok) throw new Error('Failed to fetch CRL');
    return await res.json();
  }

  // Messaging & Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/messaging/conversations`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    const data = await res.json();
    return data.conversations;
  }

  async createConversation(participantIds: string[], title?: string, isGroup: boolean = false): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/messaging/conversations`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ participant_ids: participantIds, title, is_group: isGroup })
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    const data = await res.json();
    return data.conversation;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/messaging/conversations/${conversationId}/messages`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    const data = await res.json();
    return data.messages;
  }

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const res = await fetch(`${API_BASE}/messaging/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ conversation_id: conversationId, content })
    });
    if (!res.ok) throw new Error('Failed to send message');
    const data = await res.json();
    return data.message;
  }

  async sendAttachment(
    conversationId: string,
    file: File,
    recipientIds: string[],
    fingerprintEnabled: boolean,
    passphrase: string
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('recipient_ids', recipientIds.join(','));
    formData.append('fingerprint_enabled', fingerprintEnabled ? 'true' : 'false');
    formData.append('passphrase', passphrase);

    const res = await fetch(`${API_BASE}/messaging/conversations/${conversationId}/attachments`, {
      method: 'POST',
      headers: { 'X-User-Id': this.currentUserId },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to send attachment');
    }
    return await res.json();
  }

  // Documents & Decryption
  async listDocuments(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/documents`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return await res.json();
  }

  async getDocumentInfo(documentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${documentId}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load document info');
    return await res.json();
  }

  async getDocumentProvenance(documentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${documentId}/provenance`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load document provenance');
    return await res.json();
  }

  async decryptDocument(documentId: string, passphrase: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${documentId}/decrypt`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ passphrase })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Decryption failed');
    }
    const data = await res.json();
    return data.decrypted;
  }

  // Forensics
  async analyzeLeakedDocument(file: File): Promise<ForensicAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/forensics/analyze`, {
      method: 'POST',
      headers: { 'X-User-Id': this.currentUserId },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Forensic analysis failed');
    }
    const data = await res.json();
    return data.analysis;
  }

  async exportEvidence(analysisResult: any): Promise<any> {
    const res = await fetch(`${API_BASE}/forensics/export-evidence`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ analysis_result: analysisResult })
    });
    if (!res.ok) throw new Error('Failed to export evidence dossier');
    return await res.json();
  }

  async testRobustness(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/forensics/test-robustness`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Robustness test failed');
    return await res.json();
  }

  // Ledger & Consensus
  async getLedgerBlocks(): Promise<{ blocks: LedgerBlock[]; chain_length: number }> {
    const res = await fetch(`${API_BASE}/ledger/blocks`);
    if (!res.ok) throw new Error('Failed to fetch ledger blocks');
    return await res.json();
  }

  async getValidators(): Promise<any> {
    const res = await fetch(`${API_BASE}/ledger/validators`);
    if (!res.ok) throw new Error('Failed to fetch validators');
    return await res.json();
  }

  async verifyChain(): Promise<any> {
    const res = await fetch(`${API_BASE}/ledger/verify-chain`, { method: 'POST' });
    if (!res.ok) throw new Error('Chain verification request failed');
    return await res.json();
  }

  async simulateTamper(blockHeight: number, targetField: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ledger/simulate-tamper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ block_height: blockHeight, target_field: targetField })
    });
    if (!res.ok) throw new Error('Tamper simulation failed');
    return await res.json();
  }

  // Admin & System
  async getSystemHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/admin/system-health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return await res.json();
  }

  async getAuditLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const data = await res.json();
    return data.audit_logs;
  }

  // Demo Runner & Step Orchestrator
  async getDemoState(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/state`);
    if (!res.ok) throw new Error('Failed to fetch demo state');
    return await res.json();
  }

  async resetDemo(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo');
    return await res.json();
  }

  async runDemoStep(stepNum: number): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/step/${stepNum}`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || `Failed to run step ${stepNum}`);
    }
    return await res.json();
  }

  async runFullDemoScenario(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/run-scenario`, { method: 'POST' });
    if (!res.ok) throw new Error('Demo scenario failed');
    return await res.json();
  }

  async runDemoScenario(): Promise<any> {
    return this.runFullDemoScenario();
  }
}

export const api = new ApiClient();
