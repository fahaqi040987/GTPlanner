"""
LLM configuration service: admin presets, personal overrides, and resolution

Implements the PRD v2.2.0 resolution order per generation request:
user's explicit choice (personal or preset) -> active admin preset -> error.
"""
from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam
from sqlalchemy.orm import Session

from ..core.encryption import safe_mask_encrypted, secret_encryption
from ..models.llm_config import LLMPreset, UserLLMConfig
from ..models.schemas import (
    LLMPresetCreate,
    LLMPresetResponse,
    LLMPresetUpdate,
    LLMTestResult,
    UserLLMConfigData,
    UserLLMConfigResponse,
)
from ..models.user import User

# Minimal live call used by "Test connection": no max_tokens so it works
# across providers/models (some reject max_tokens, e.g. o-series)
_TEST_PROMPT: list[ChatCompletionMessageParam] = [
    {"role": "user", "content": "Reply with the single word: OK"}
]
_TEST_TIMEOUT_SECONDS = 15.0


class LLMConfigError(ValueError):
    """LLM configuration error with a user-actionable message"""


class LLMConfigService:
    """CRUD for presets/personal overrides, activation, resolution, testing"""

    # --- Admin presets ---

    def preset_to_response(self, preset: LLMPreset) -> LLMPresetResponse:
        """Map a preset row to its API response (key masked, never full)"""
        return LLMPresetResponse(
            id=preset.id,
            name=preset.name,
            base_url=preset.base_url,
            model=preset.model,
            is_active=preset.is_active,
            api_key_masked=safe_mask_encrypted(preset.api_key_encrypted),
            created_at=preset.created_at,
            updated_at=preset.updated_at,
        )

    def list_presets(self, db: Session) -> list[LLMPreset]:
        """List all presets, active first"""
        return (
            db.query(LLMPreset)
            .order_by(LLMPreset.is_active.desc(), LLMPreset.id)
            .all()
        )

    def get_preset(self, db: Session, preset_id: int) -> LLMPreset | None:
        return db.query(LLMPreset).filter(LLMPreset.id == preset_id).first()

    def create_preset(self, db: Session, data: LLMPresetCreate) -> LLMPreset:
        """Create a preset with an encrypted API key"""
        existing = db.query(LLMPreset).filter(LLMPreset.name == data.name).first()
        if existing:
            raise LLMConfigError(f"A preset named '{data.name}' already exists")

        preset = LLMPreset(
            name=data.name,
            base_url=data.base_url,
            api_key_encrypted=secret_encryption.encrypt(data.api_key),
            model=data.model,
            is_active=False,
        )
        # First preset created becomes active automatically, so the platform
        # works out of the box after admin setup
        if db.query(LLMPreset).count() == 0:
            preset.is_active = True

        db.add(preset)
        db.commit()
        db.refresh(preset)
        return preset

    def update_preset(
        self, db: Session, preset_id: int, data: LLMPresetUpdate
    ) -> LLMPreset | None:
        """Partial update; re-encrypts the key when a new one is provided"""
        preset = self.get_preset(db, preset_id)
        if not preset:
            return None

        if data.name is not None and data.name != preset.name:
            clash = db.query(LLMPreset).filter(LLMPreset.name == data.name).first()
            if clash:
                raise LLMConfigError(f"A preset named '{data.name}' already exists")
            preset.name = data.name
        if data.base_url is not None:
            preset.base_url = data.base_url
        if data.api_key is not None:
            preset.api_key_encrypted = secret_encryption.encrypt(data.api_key)
        if data.model is not None:
            preset.model = data.model

        db.commit()
        db.refresh(preset)
        return preset

    def delete_preset(self, db: Session, preset_id: int) -> bool:
        """Delete a preset (including the active one — resolution then reports
        that no LLM is configured until another preset is activated)"""
        preset = self.get_preset(db, preset_id)
        if not preset:
            return False
        db.delete(preset)
        db.commit()
        return True

    def activate_preset(self, db: Session, preset_id: int) -> LLMPreset | None:
        """Mark the given preset active and all others inactive"""
        preset = self.get_preset(db, preset_id)
        if not preset:
            return None

        db.query(LLMPreset).filter(LLMPreset.is_active.is_(True)).update(
            {LLMPreset.is_active: False}
        )
        preset.is_active = True
        db.commit()
        db.refresh(preset)
        return preset

    # --- Personal override (BYO key) ---

    def user_config_to_response(
        self, config: UserLLMConfig
    ) -> UserLLMConfigResponse:
        return UserLLMConfigResponse(
            base_url=config.base_url,
            model=config.model,
            api_key_masked=safe_mask_encrypted(config.api_key_encrypted),
            updated_at=config.updated_at,
        )

    def get_user_config(self, db: Session, user_id: int) -> UserLLMConfig | None:
        return (
            db.query(UserLLMConfig)
            .filter(UserLLMConfig.user_id == user_id)
            .first()
        )

    def upsert_user_config(
        self, db: Session, user_id: int, data: UserLLMConfigData
    ) -> UserLLMConfig:
        """Create or fully replace the user's personal LLM override"""
        config = self.get_user_config(db, user_id)
        if config is None:
            config = UserLLMConfig(user_id=user_id)
            db.add(config)

        config.base_url = data.base_url
        config.api_key_encrypted = secret_encryption.encrypt(data.api_key)
        config.model = data.model

        db.commit()
        db.refresh(config)
        return config

    def delete_user_config(self, db: Session, user_id: int) -> bool:
        """Remove the user's personal LLM override"""
        config = self.get_user_config(db, user_id)
        if not config:
            return False
        db.delete(config)
        db.commit()
        return True

    # --- Resolution (PRD v2.2.0 order) ---

    def resolve_llm_config(
        self,
        db: Session,
        user: User,
        preset_id: int | None = None,
        use_personal: bool = False,
    ) -> tuple[str, str, str]:
        """
        Resolve the LLM (base_url, api_key, model) for a generation request.

        Order: user's explicit choice (personal override or named preset)
        -> active admin preset -> LLMConfigError with setup guidance.
        """
        if use_personal:
            config = self.get_user_config(db, user.id)
            if not config:
                raise LLMConfigError(
                    "No personal LLM configured. Add one in Settings "
                    "or pick a preset."
                )
            return (
                config.base_url,
                secret_encryption.decrypt(config.api_key_encrypted),
                config.model,
            )

        if preset_id is not None:
            preset = self.get_preset(db, preset_id)
            if not preset:
                raise LLMConfigError("Selected preset not found")
            return (
                preset.base_url,
                secret_encryption.decrypt(preset.api_key_encrypted),
                preset.model,
            )

        active = (
            db.query(LLMPreset).filter(LLMPreset.is_active.is_(True)).first()
        )
        if active:
            return (
                active.base_url,
                secret_encryption.decrypt(active.api_key_encrypted),
                active.model,
            )

        raise LLMConfigError(
            "No LLM configured yet. Ask an admin to add a preset, "
            "or add a personal LLM in Settings."
        )

    # --- Connection test ---

    def test_connection(self, base_url: str, api_key: str, model: str) -> LLMTestResult:
        """Minimal live call to verify a config works with its provider"""
        try:
            client = OpenAI(
                api_key=api_key,
                base_url=base_url,
                timeout=_TEST_TIMEOUT_SECONDS,
            )
            response = client.chat.completions.create(
                model=model,
                messages=_TEST_PROMPT,
            )
            reply = (response.choices[0].message.content or "").strip()
            return LLMTestResult(
                success=True,
                message=f"Connection successful — model replied: {reply[:50]}",
                model=model,
            )
        except Exception as e:
            # Surface the provider error verbatim per PRD risk mitigation
            return LLMTestResult(
                success=False,
                message=f"Connection failed: {str(e)[:300]}",
                model=model,
            )


# Global instance
llm_config_service = LLMConfigService()
