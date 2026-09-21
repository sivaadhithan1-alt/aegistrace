export interface UserInfo {
  user_id: string;
  display_name: string;
  role: string;
  status: string;
  created_at: string;
  certificate: {
    version: string;
    thumbprint_sha3: string;
    subject: {
      certificate_id: string;
      issuer_ca_id: string;
      issuer_name: string;
      user_id: string;
      display_name: string;
      role: string;
      issued_at: string;
      expires_at: string;
      public_keys: {
        kem_algorithm: string;
        kem_public_key: string;
        signature_algorithm: string;
        dsa_public_key: string;
      };
    };
    ca_signature: {
      algorithm: string;
      signature: string;
    };
  };
}

export interface ConversationMember {
  user_id: string;
  display_name: string;
  role: string;
}

export interface Conversation {
  conversation_id: string;
  title: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  members: string[];
  last_message?: Message | null;
}

export interface ForensicProtectionStatus {
  enabled: boolean;
  status: string;
  verification_status: string;
  recipient_binding: string;
  ledger_status: string;
  protected_at?: string;
}

export interface DocumentInfo {
  document_id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  fingerprint_enabled: boolean;
  recipients: Array<{
    recipient_id: string;
    decryption_count: number;
    first_decrypted_at?: string;
    last_decrypted_at?: string;
  }>;
}

export interface Message {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'TEXT' | 'DOCUMENT' | 'SYSTEM';
  document_id?: string | null;
  status: 'SENT' | 'DELIVERED' | 'READ';
  created_at: string;
  document_info?: DocumentInfo;
}

export interface BlockHeader {
  block_height: number;
  previous_block_hash: string;
  merkle_root: string;
  timestamp: string;
  validator_threshold: number;
  total_validators: number;
  consensus_algorithm: string;
}

export interface ValidatorSignature {
  validator_id: string;
  validator_name: string;
  algorithm: string;
  signature: string;
  public_key: string;
  timestamp: string;
}

export interface LedgerBlock {
  header: {
    block_height: number;
    previous_block_hash: string;
    merkle_root: string;
    timestamp: string;
    validator_threshold: number;
    total_validators: number;
    consensus_algorithm: string;
  };
  block_hash: string;
  transactions: any[];
  validator_signatures: ValidatorSignature[];
}

export interface ForensicAnalysisResult {
  forensic_status: string;
  confidence_level: 'CRYPTOGRAPHICALLY_VERIFIED' | 'VERIFICATION_FAILED';
  status_text: string;
  verified: boolean;
  filename: string;
  file_size: number;
  file_hash_sha3: string;
  verification_checkpoints?: {
    watermark_authenticated: boolean;
    ledger_transaction_located: boolean;
    merkle_inclusion_verified: boolean;
    recipient_binding_verified: boolean;
    mldsa_signature_verified: boolean;
    validator_quorum_verified: boolean;
    chain_integrity_verified: boolean;
  };
  attributed_recipient?: {
    user_id: string;
    display_name: string;
    role: string;
    certificate_id?: string;
  } | null;
  cryptographic_verification?: {
    signature_algorithm: string;
    signature_valid: boolean;
    merkle_proof_valid: boolean;
    ledger_block_height: number;
    ledger_block_hash: string;
    ledger_tx_id: string;
    ledger_tx_hash: string;
    validator_signatures_count: number;
  };
  details?: string;
}

export interface SystemHealth {
  deployment_mode: string;
  air_gap_enforced: boolean;
  pqc_preflight?: {
    provider: string;
    kem_algorithm: string;
    signature_algorithm: string;
    kem_available: boolean;
    sig_available: boolean;
    kem_self_test: boolean;
    sig_self_test: boolean;
    status: string;
  };
  crypto_suite: {
    kem: string;
    signature: string;
    aead: string;
    hash: string;
    kdf: string;
  };
  identity_pki: {
    root_ca_id: string;
    root_ca_name: string;
    enrolled_users_count: number;
    revocations_count: number;
  };
  ledger_consensus: {
    consensus_type: string;
    total_validators: number;
    online_validators: number;
    latest_block_height: number;
    total_blocks: number;
  };
  storage_metrics: {
    total_encrypted_documents: number;
    total_forensic_decryption_events: number;
  };
}
