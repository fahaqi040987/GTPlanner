# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## GTPlanner Architecture

GTPlanner is an AI-powered PRD (Product Requirements Document) generator that transforms natural language descriptions into structured technical documentation. The system follows a **stateless, functional architecture** where the Agent layer maintains no state - all state management is handled by clients (CLI, API, Claude Code skill).

### Core Components

**PocketFlow-based Async Workflow Engine**
- Built on [PocketFlow](https://github.com/The-Pocket/PocketFlow) async workflow framework
- Main flow: `ReActOrchestratorFlow` in `gtplanner/agent/flows/react_orchestrator_refactored/`
- Supports tracing via `pocketflow_tracing` for observability

**Agent Tools (Function Calling)**
- Defined in `gtplanner/agent/function_calling/agent_tools.py`
- Tools: `short_planning`, `research`, `design` (and optional tools based on API keys)
- Each tool is an atomic subflow that takes explicit parameters

**Nodes (Tool Implementations)**
- Located in `gtplanner/agent/nodes/`
- Key nodes: `node_prefab_recommend`, `node_search`, `node_call_prefab_function`, `node_view_document`, `node_url`
- Each node implements a specific tool capability

**Data Flow Architecture**
1. Client (CLI/API/Skill) creates `AgentContext` with dialogue history and tool results
2. `PocketFlowSharedFactory.create_shared_dict()` converts context to PocketFlow shared dict
3. ReAct orchestrator executes the flow, calling tools as needed
4. `PocketFlowSharedFactory.create_agent_result()` converts result back to `AgentResult`
5. Client merges the result (new messages + tool result updates) into its state

**Stateless Design Principle**
- Agent layer (`gtplanner/agent/`) is completely stateless
- All functions are pure - same input produces same output
- `AgentContext` is read-only, never modified by Agent
- `AgentResult` contains only incremental updates (new messages, tool result deltas)
- Client is responsible for state persistence and compression

## Development Commands

### Package Management (uv)

```bash
# Install dependencies
uv sync

# Install with dev dependencies
uv sync --dev

# Add a dependency
uv add <package>

# Run Python with uv environment
uv run python <script>
```

### Running Tests

```bash
# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/test_basic.py

# Run with coverage
uv run pytest --cov=gtplanner --cov-report=html

# Run specific test
uv run pytest tests/test_basic.py::test_import_gtplanner
```

### Running the Application

```bash
# CLI (interactive mode)
python gtplanner.py

# CLI (direct execution)
python gtplanner.py "Design a blog system"

# FastAPI server
uv run fastapi_main.py
# Access API docs at http://0.0.0.0:11211/docs

# MCP service
cd mcp
uv sync
uv run python mcp_service.py
```

### Claude Code Skill

```bash
# Initialize skill in Claude Code
/gtplanner-init

# The skill responds to trigger words: PRD, 项目规划, 架构设计, 技术方案, 设计文档
```

## Configuration

**Required Environment Variables** (`.env` file):
```bash
LLM_API_KEY="your-api-key"
LLM_BASE_URL="https://api.openai.com/v1"
LLM_MODEL="gpt-5"
```

**Optional Configuration**:
```bash
# For research tool
JINA_API_KEY="your-jina-api-key"

# For prefab recommendation (vector search)
VECTOR_SERVICE_BASE_URL="http://localhost:8080"
VECTOR_SERVICE_INDEX_NAME="document_gtplanner_prefabs"
```

**Settings File** (`settings.toml`):
- Multilingual support settings
- Logging configuration
- Vector service settings
- OpenAI debug settings

## Key File Locations

**Entry Points**:
- `gtplanner.py` - CLI entry point
- `fastapi_main.py` - FastAPI server entry point
- `mcp/mcp_service.py` - MCP service entry point

**Core Agent Logic**:
- `gtplanner/agent/gtplanner.py` - Main GTPlanner class
- `gtplanner/agent/pocketflow_factory.py` - Context/result conversion
- `gtplanner/agent/context_types.py` - Data type definitions
- `gtplanner/agent/flows/react_orchestrator_refactored/` - Main workflow

**Tools and Nodes**:
- `gtplanner/agent/function_calling/agent_tools.py` - Tool definitions
- `gtplanner/agent/nodes/` - Tool implementations

**Utilities**:
- `gtplanner/utils/config_manager.py` - Configuration management (Dynaconf)
- `gtplanner/utils/openai_client.py` - OpenAI API client

## Working with Prefabs

Prefabs are standardized, reusable AI functional components. The prefab registry is in `prefabs/releases/community-prefabs.json`.

**To add a new prefab**:
1. Create prefab using [Prefab-Template](https://github.com/The-Agent-Builder/Prefab-Template)
2. Publish GitHub Release with `.whl` file
3. Submit PR to `prefabs/releases/community-prefabs.json`

**Prefab structure**:
```json
{
  "id": "unique-prefab-id",
  "version": "1.0.0",
  "name": "Prefab Name",
  "description": "Functional description",
  "author": "Author",
  "repository": "https://github.com/...",
  "functions": [...]
}
```

## Code Patterns

### Creating a New Tool/Node

1. Create node in `gtplanner/agent/nodes/node_<name>.py`
2. Implement as async function compatible with PocketFlow
3. Add tool definition in `agent_tools.py`
4. Update `short_planning` or other relevant flows to call the tool

### Stateless Agent Pattern

When modifying agent code:
- Never maintain state in agent classes
- All data must flow through `shared` dict
- Return only incremental changes in `AgentResult`
- Use `PocketFlowSharedFactory` for conversions

### Multilingual Support

GTPlanner supports zh, en, ja, es, fr. Language detection is automatic. To add language-specific prompts:
1. Add prompt templates in `gtplanner/agent/prompts/templates/`
2. Use `PromptManager` to load language-specific templates
3. Language is determined from `shared["language"]` or auto-detected

## Testing Strategy

- Unit tests for individual components in `tests/`
- Integration tests for flows and tools
- E2E test for Claude Code skill: `tests/test_skill_e2e.py`
- Test utilities handle session creation and cleanup

## Important Notes

- **Always use uv** for package management (not pip directly)
- **Stateless design**: Agent layer never stores state between calls
- **PocketFlow tracing** is available for debugging workflow issues
- **OpenAI compatibility**: Uses OpenAI API format for messages and tool calls
- **Multimodal support**: Message content can be text or list (text + images)
