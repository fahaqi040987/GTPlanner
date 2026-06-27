# Indonesian Language Support Design Document

## Project Information
- **Date**: 2025-06-27
- **Status**: Design Complete - Ready for Implementation
- **Priority**: High
- **Effort Estimate**: 2-4 hours

---

## Understanding Summary

**What is being built:**
Complete Indonesian (Bahasa Indonesia) language support for GTPlanner, with Indonesian set as the default language.

**Why it exists:**
- User wants to interact with GTPlanner in Indonesian (Bahasa Indonesia)
- Indonesian is currently not in the supported languages list
- Current outputs are in Chinese, which is not desired
- User needs full Indonesian language support with Indonesian as the primary/default language

**Who it is for:**
- Indonesian-speaking users who want to use GTPlanner in their native language
- Users who need Indonesian as the primary/default language for all interactions

**Key constraints:**
- Indonesian must be added to the supported languages list
- Indonesian must be set as the default language
- Current LLM: `GLM-4.6V-Flash` (Chinese model)
- Language detection must support Indonesian
- All prompt templates must have Indonesian versions

**Scope of work:**
1. Add "id" to `supported_languages` in `settings.toml`
2. Set `default_language = "id"` in `settings.toml`
3. Create Indonesian prompt templates in `gtplanner/agent/prompts/templates/`
4. Update language detection to recognize Indonesian
5. Test across all components (CLI, API, tools)

**Explicit non-goals:**
- Not removing existing language support (en, zh, es, fr, ja remain)
- Not changing the core architecture, only adding a language
- Not modifying LLM behavior beyond language configuration

---

## Assumptions

1. **User has CLI access** - Can modify configuration files and templates
2. **Language code**: "id" (ISO 639-1 code for Indonesian)
3. **Template location**: New templates go in `gtplanner/agent/prompts/templates/`
4. **LLM compatibility**: GLM-4.6V-Flash model should support Indonesian (needs verification during testing)
5. **User has template translations** or can translate from English templates
6. **Testing access**: User can run CLI and API for testing

---

## Final Design

### Section 1: Configuration Changes

**File:** `settings.toml`

**Modifications in `[default.multilingual]` section:**

```toml
[default.multilingual]
# Default language for the system - changed to Indonesian
default_language = "id"  # Changed from "en"

# Enable automatic language detection from user input
auto_detect = true

# Fallback to default language when requested language is not supported
fallback_enabled = true

# Supported languages - added Indonesian
supported_languages = ["id", "en", "zh", "es", "fr", "ja"]  # Added "id" at start
```

**Rationale:**
- `"id"` is the ISO 639-1 code for Indonesian (Bahasa Indonesia)
- Placed first in `supported_languages` to indicate priority
- `default_language = "id"` ensures all responses default to Indonesian
- `auto_detect = true` allows flexibility for other languages when needed

**No changes needed in `.env`** - language configuration is in `settings.toml` only.

---

### Section 2: Language Detection Updates

**File:** `gtplanner/utils/language_detection.py`

**Changes required:**

1. **Update `SupportedLanguage` enum:**
   ```python
   class SupportedLanguage(Enum):
       ID = "id"      # Indonesian (Bahasa Indonesia)
       EN = "en"      # English
       ZH = "zh"      # Chinese
       ES = "es"      # Spanish
       FR = "fr"      # French
       JA = "ja"      # Japanese
   ```

2. **Add Indonesian detection patterns:**
   - Common Indonesian words/phrases for detection
   - Character sets and script detection (Latin script like English)
   - Language model detection for Indonesian

3. **Update language name mapping:**
   - Add display name: "Bahasa Indonesia" or "Indonesian"

**How it works:**
- When user inputs text, detector analyzes patterns
- Indonesian detected → sets `language = "id"`
- Triggers Indonesian template loading
- Falls back to default if detection uncertain

---

### Section 3: Prompt Templates Structure

**Directory:** `gtplanner/agent/prompts/templates/`

**New structure to create:**
```
templates/
├── id/           # NEW - Indonesian templates
│   ├── system_prompts.json
│   ├── task_prompts.json
│   └── examples.json
├── en/
├── zh/
├── ja/
├── es/
└── fr/
```

**Template files content:**

- **`system_prompts.json`** - System role prompts for the LLM:
  - Agent system instructions
  - Tool use instructions
  - Response format guidelines

- **`task_prompts.json`** - Task-specific prompts:
  - `short_planning` - Project planning prompts
  - `design` - Architecture design prompts
  - `research` - Technical research prompts
  - `tool_recommend` - Tool recommendation prompts

- **`examples.json`** - Usage examples in Indonesian

**Translation approach:**
- Translate from English templates to Indonesian
- Maintain technical accuracy (keep technical terms in English where appropriate)
- Preserve prompt structure and formatting

---

### Section 4: Implementation Steps

**Phase 1: Configuration (Quick win)**
1. Modify `settings.toml` - Change `default_language = "id"` and add "id" to `supported_languages`
2. Test basic language detection works

**Phase 2: Language Detection (Foundation)**
3. Update `gtplanner/utils/language_detection.py`:
   - Add `ID = "id"` to `SupportedLanguage` enum
   - Add Indonesian detection patterns
   - Test detection with Indonesian text samples

**Phase 3: Template Creation (Core work)**
4. Create directory: `gtplanner/agent/prompts/templates/id/`
5. Create and translate `system_prompts.json`:
   - Agent system instructions
   - Tool use guidelines
6. Create and translate `task_prompts.json`:
   - Short planning prompts
   - Design prompts
   - Research prompts
   - Tool recommendation prompts
7. Create `examples.json` with Indonesian examples

**Phase 4: Integration**
8. Update `gtplanner/utils/prompt_templates.py` to recognize "id" language code
9. Update `MultilingualManager` to include Indonesian
10. Test template loading for Indonesian

**Phase 5: Testing**
11. CLI testing with Indonesian input
12. API testing with Indonesian language parameter
13. Verify fallback to English if templates missing

**Estimated effort:** 2-4 hours for full implementation

---

### Section 5: Testing Strategy

**Level 1: Unit Tests**
- Test language detection with Indonesian text samples
- Test template loading for "id" language code
- Test fallback mechanism when Indonesian templates missing

**Level 2: Integration Tests**
- Test CLI with Indonesian input:
  ```bash
  python gtplanner.py "Buat sistem blog dengan Django"
  ```
- Test API with language parameter:
  ```bash
  curl -X POST "http://localhost:11211/generate" \
    -H "Content-Type: application/json" \
    -d '{"user_input": "...", "language": "id"}'
  ```

**Level 3: End-to-End Tests**
- Full workflow test: Indonesian input → Indonesian planning → Indonesian design document
- Verify all tools output Indonesian responses
- Test with mixed input (Indonesian + English terms)

**Test Data Samples:**
- Pure Indonesian text
- Indonesian with technical terms (English)
- Mixed Indonesian/English input

**Success Criteria:**
- ✅ Language detection identifies Indonesian correctly
- ✅ Indonesian templates load without errors
- ✅ CLI outputs Indonesian responses
- ✅ API respects `language="id"` parameter
- ✅ All tools respond in Indonesian
- ✅ Fallback works for missing templates

---

## Decision Log

| Decision | Alternatives Considered | Rationale |
|----------|------------------------|-----------|
| Option A (Full Implementation) | B (Minimal), C (Alias) | Proper architecture, best UX, maintainable |
| Language code "id" | "ind", "bahasa" | ISO 639-1 standard, consistent with system |
| Create full template set | Partial templates | Consistency, complete Indonesian experience |
| Set as default language | Keep as optional | User wants Indonesian-first experience |
| Keep auto-detect enabled | Force Indonesian only | Flexibility for mixed-language input |

---

## Implementation Notes

### Files to Modify:
1. `settings.toml` - Add Indonesian, set as default
2. `gtplanner/utils/language_detection.py` - Add Indonesian detection
3. `gtplanner/utils/prompt_templates.py` - Add Indonesian template loading

### Files to Create:
1. `gtplanner/agent/prompts/templates/id/system_prompts.json`
2. `gtplanner/agent/prompts/templates/id/task_prompts.json`
3. `gtplanner/agent/prompts/templates/id/examples.json`

### Key Considerations:
- GLM-4.6V-Flash model compatibility with Indonesian should be verified during testing
- Technical terms should remain in English (e.g., "API", "database", "authentication")
- Template translation should preserve exact structure and placeholders
- Fallback mechanism ensures graceful degradation if templates are incomplete

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM doesn't support Indonesian well | High | Test early, fallback to English if needed |
| Template translation quality | Medium | Review translations, test with real inputs |
| Breaking existing language support | Low | Additive changes only, don't modify existing templates |
| Detection accuracy for Indonesian | Low | Test with various Indonesian text samples |

---

## Next Steps

1. **Review this design document** - Confirm all requirements are captured
2. **Prepare template translations** - Translate English templates to Indonesian
3. **Begin implementation** - Follow the implementation steps in order
4. **Test incrementally** - Test each phase before moving to the next
5. **Deploy** - Once all tests pass, the feature is ready for use

---

## Appendix: Sample Indonesian Test Inputs

For testing language detection and templates:

```bash
# Pure Indonesian
python gtplanner.py "Buat sistem manajemen konten blog dengan fitur autentikasi pengguna"

# Indonesian with technical terms
python gtplanner.py "Bangun API RESTful menggunakan FastAPI dengan database PostgreSQL"

# Mixed Indonesian/English
python gtplanner.py "Saya ingin membuat web application dengan React dan Django backend"
```

---

**Document Status:** Complete - Ready for Implementation
**Last Updated:** 2025-06-27
