"""
Database Schema Definition, Foreign Keys, Unique Constraints, and Indexing.
"""

import sqlite3

def create_tables(conn: sqlite3.Connection):
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS conversations (
        conversation_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        is_group INTEGER DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversation_members (
        conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        PRIMARY KEY (conversation_id, user_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
        message_id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        content TEXT,
        message_type TEXT DEFAULT 'TEXT', -- 'TEXT', 'DOCUMENT', 'SYSTEM'
        document_id TEXT,
        status TEXT DEFAULT 'DELIVERED',  -- 'SENT', 'DELIVERED', 'READ'
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
        document_id TEXT PRIMARY KEY,
        original_filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        content_hash_sha3 TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        fingerprint_enabled INTEGER DEFAULT 1,
        sdoc_filename TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_recipients (
        document_id TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        decryption_count INTEGER DEFAULT 0,
        first_decrypted_at TEXT,
        last_decrypted_at TEXT,
        PRIMARY KEY (document_id, recipient_id),
        FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS decryption_events (
        event_id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        fingerprint_id TEXT NOT NULL UNIQUE,
        block_height INTEGER NOT NULL,
        tx_id TEXT NOT NULL,
        tx_hash TEXT NOT NULL,
        forensic_copy_filename TEXT,
        forensic_copy_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        log_id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        target_id TEXT,
        details TEXT,
        ip_address TEXT DEFAULT '127.0.0.1 (Local Enclave)',
        timestamp TEXT NOT NULL
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_decryption_fp ON decryption_events(fingerprint_id);
    CREATE INDEX IF NOT EXISTS idx_decryption_doc ON decryption_events(document_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    """)

    conn.commit()
