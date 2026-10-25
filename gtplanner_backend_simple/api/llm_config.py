"""
LLM configuration routes: admin presets, public picker, connection test,
and the personal BYO-key override (PRD v2.2.0)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.encryption import secret_encryption
from ..models.schemas import (
    LLMPresetCreate,
    LLMPresetPublicResponse,
    LLMPresetResponse,
    LLMPresetUpdate,
    LLMTestRequest,
    LLMTestResult,
    UserLLMConfigData,
    UserLLMConfigResponse,
)
from ..models.user import User
from ..services.llm_config_service import (
    LLMConfigError,
    LLMConfigService,
)
from .deps import (
    get_current_admin_user,
    get_current_user,
    provide_llm_config_service,
)

router = APIRouter(tags=["llm"])


@router.get(
    "/api/admin/llm/presets", response_model=list[LLMPresetResponse]
)
async def list_presets(
    _admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    llm_config_service: LLMConfigService = Depends(provide_llm_config_service),
) -> list[LLMPresetResponse]:
    """All presets (admin): keys masked, never full"""
    return [
        llm_config_service.preset_to_response(preset)
        for preset in llm_config_service.list_presets(db)
    ]


@router.post(
    "/api/admin/llm/presets",
    response_model=LLMPresetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_preset(
    payload: LLMPresetCreate,
    _admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    llm_config_service: LLMConfigService = Depends(provide_llm_config_service),
) -> LLMPresetResponse:
    """Create a preset; the API key is encrypted at rest"""
    try:
        preset = llm_config_service.create_preset(db, payload)
    except LLMConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return llm_config_service.preset_to_response(preset)


@router.put(
    "/api/admin/llm/presets/{preset_id}", response_model=LLMPresetResponse
)
async def update_preset(
    preset_id: int,
    payload: LLMPresetUpdate,
    _admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    llm_config_service: LLMConfigService = Depends(provide_llm_config_service),
) -> LLMPresetResponse:
    """Partial update of a preset; a new key is re-encrypted"""
    try:
        preset = llm_config_service.update_preset(db, preset_id, payload)
    except LLMConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    if preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found"
        )
    return llm_config_service.preset_to_response(preset)


@router.delete(
    "/api/admin/llm/presets/{preset_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_preset(
    preset_id: int,
    _admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    llm_config_service: LLMConfigService = Depends(provide_llm_config_service),
) -> None:
    """Delete a preset (including the active one)"""
    deleted = llm_config_service.delete_preset(db, preset_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found"
        )


@router.post(
    "/api/admin/llm/presets/{preset_id}/activate",
    response_model=LLMPresetResponse,
)
async def activate_preset(
    preset_id: int,
    _admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    llm_config_service: LLMConfigService = Depends(provide_llm_config_service),
) -> LLMPresetResponse:
    """Make this preset the single active platform default"""
    preset = llm_config_service.activate_preset(db, preset_id)
    if preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found"
        )
    return llm_config_service.preset_to_response(preset)


@router.post(
    "/api/admin/llm/presets/{preset_id}/test", response_model=LLMTestResult
)
async def test_preset(
    preset_id: int,
    _admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    llm_config_service: LLMConfigService = Depends(provide_llm_config_service),
) -> LLMTestResult:
    """Minimal live call using the stored (decrypted) key"""
    preset = llm_config_service.get_preset(db, preset_id)
    if preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found"
        )
    try:
        api_key = secret_encryption.decrypt(preset.api_key_encrypted)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return llm_config_service.test_connection(
        preset.base_url, api_key, preset.model
    )


@router.get("/api/llm/presets", response_model=list[LLMPresetPublicResponse])
async def list_public_presets(
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    llm_config_service: LLMConfigService = Depends(provide_llm_config_service),
) -> list[LLMPresetPublicResponse]:
    """Wizard picker data: names and models only — no URLs, no keys"""
    return [
        LLMPresetPublicResponse(
            id=preset.id,
            name=preset.name,
            model=preset.model,
            is_active=preset.is_active,
        )
        for preset in llm_config_service.list_presets(db)
    ]


@router.post("/api/llm/test", response_model=LLMTestResult)
async def test_llm_config(
    payload: LLMTestRequest,
    _current_user: User = Depends(get_current_user),
    llm_config_service: LLMConfigService = Depends(provide_llm_config_service),
) -> LLMTestResult:
    """Connection test for an arbitrary (usually unsaved) config"""
    return llm_config_service.test_connection(
        payload.base_url, payload.api_key, payload.model
    )


@router.get("/api/me/llm-config", response_model=UserLLMConfigResponse)
async def get_my_llm_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    llm_config_service: LLMConfigService = Depends(provide_llm_config_service),
) -> UserLLMConfigResponse:
    """The caller's personal LLM override (key masked)"""
    config = llm_config_service.get_user_config(db, current_user.id)
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No personal LLM configured",
        )
    return llm_config_service.user_config_to_response(config)


@router.put("/api/me/llm-config", response_model=UserLLMConfigResponse)
async def save_my_llm_config(
    payload: UserLLMConfigData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    llm_config_service: LLMConfigService = Depends(provide_llm_config_service),
) -> UserLLMConfigResponse:
    """Create or fully replace the caller's personal LLM override"""
    config = llm_config_service.upsert_user_config(
        db, current_user.id, payload
    )
    return llm_config_service.user_config_to_response(config)


@router.delete("/api/me/llm-config", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_llm_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    llm_config_service: LLMConfigService = Depends(provide_llm_config_service),
) -> None:
    """Remove the caller's personal LLM override"""
    deleted = llm_config_service.delete_user_config(db, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No personal LLM configured",
        )
