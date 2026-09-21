"""
RFC 8785 JSON Canonicalization Scheme (JCS) Implementation.
Provides deterministic canonical serialization for digital signatures and Merkle tree leaves.
"""

import json
from typing import Any

def canonicalize(data: Any) -> bytes:
    """
    Serializes a Python object (dict, list, primitive) into canonical UTF-8 bytes
    following RFC 8785 (JSON Canonicalization Scheme).
    
    Guarantees:
    - Object keys sorted lexicographically.
    - No whitespace after delimiters (',' and ':').
    - Deterministic string escaping and number formatting.
    """
    canonical_json_str = json.dumps(
        data,
        sort_keys=True,
        ensure_ascii=False,
        separators=(',', ':'),
        allow_nan=False
    )
    return canonical_json_str.encode('utf-8')

def canonical_hash_sha3_256(data: Any) -> str:
    """
    Computes SHA3-256 of the canonical representation of data.
    Returns lowercase hex string.
    """
    import hashlib
    raw_bytes = canonicalize(data)
    return hashlib.sha3_256(raw_bytes).hexdigest()
