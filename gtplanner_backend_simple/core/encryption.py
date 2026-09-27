"""
Field-level encryption for secrets stored in the database (LLM API keys)

PRD v2.2.0: preset and personal API keys are encrypted at rest with an
application-level key from the server environment; APIs never return full
keys after save.
"""
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from .config import settings

_MASK = "****"


def mask_secret(value: str) -> str:
    """Mask a secret for API responses, e.g. 'sk-ab****wxyz'"""
    if not value:
        return ""
    if len(value) <= 8:
        return _MASK
    return f"{value[:4]}{_MASK}{value[-4:]}"


def safe_mask_encrypted(ciphertext: str) -> str:
    """
    Mask a stored secret without ever raising: if decryption fails
    (e.g. ENCRYPTION_KEY changed), return an opaque placeholder so listing
    endpoints keep working.
    """
    try:
        return mask_secret(secret_encryption.decrypt(ciphertext))
    except ValueError:
        return f"{_MASK} (undecryptable)"


class SecretEncryption:
    """Fernet-based symmetric encryption for sensitive columns"""

    def __init__(self, key_material: str | None = None):
        material = key_material or settings.ENCRYPTION_KEY or settings.SECRET_KEY
        # Derive a Fernet key (32-byte url-safe base64) from the key material
        digest = hashlib.sha256(material.encode("utf-8")).digest()
        self._fernet = Fernet(base64.urlsafe_b64encode(digest))

    def encrypt(self, plaintext: str) -> str:
        return self._fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")

    def decrypt(self, ciphertext: str) -> str:
        try:
            return self._fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
        except (InvalidToken, ValueError) as e:
            raise ValueError(
                "Failed to decrypt a stored secret — ENCRYPTION_KEY/SECRET_KEY "
                "changed since it was saved. Re-enter the API key."
            ) from e


# Global instance
secret_encryption = SecretEncryption()
