import uvicorn
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# 导入 SSE GTPlanner API
from gtplanner.agent.api.agent_api import SSEGTPlanner

# 导入索引管理器
from gtplanner.agent.utils.startup_init import initialize_application

# 导入 Web Interface 路由
from gtplanner.web.routes import api_router
from gtplanner.web.database import init_database

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 应用生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理：启动和关闭事件"""
    # 启动时执行
    logger.info("🚀 GTPlanner API 启动中...")

    try:
        # 初始化 Web Interface 数据库
        logger.info("🗄️  初始化 Web Interface 数据库...")
        init_database()
        logger.info("✅ Web Interface 数据库初始化完成")

    except Exception as e:
        logger.error(f"❌ Web Interface 数据库初始化失败: {str(e)}")
        # 不阻止应用启动，但记录错误

    try:
        # 初始化应用，包括预加载预制件索引
        result = await initialize_application(
            preload_index=True
        )

        if result["success"]:
            logger.info("✅ 应用初始化成功")
            if "prefab_index" in result["components"]:
                index_info = result["components"]["prefab_index"]
                logger.info(f"📦 预制件索引已就绪: {index_info.get('index_name', 'N/A')}")
        else:
            logger.error("❌ 应用初始化失败")
            for error in result["errors"]:
                logger.error(f"  - {error}")

    except Exception as e:
        logger.error(f"❌ 启动时初始化失败: {str(e)}")
        # 不阻止应用启动，但记录错误

    yield  # 应用运行期间

    # 关闭时执行（如果需要清理资源）
    logger.info("👋 GTPlanner API 正在关闭...")

app = FastAPI(
    title="GTPlanner API",
    description="""
智能规划助手 API，支持流式响应和实时工具调用

## 核心功能
- ✅ 流式 SSE 响应
- ✅ 实时工具调用
- ✅ 多模态输入（文本 + 图片）
- ✅ 多语言支持（中文、英文、日文、西班牙语、法语）

## 多模态支持 🖼️
支持用户发送图片（架构图、截图、设计稿、流程图等）：
- 图片格式：HTTP URL 或 Base64 Data URL
- 图片类型：JPEG、PNG、GIF、WebP 等
- 细节级别：auto（默认）、low（快速）、high（高精度）

详见 /api/chat/agent 接口文档。
    """,
    version="1.0.0",
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:11211",  # FastAPI server
        "*"  # 在生产环境中应该限制具体域名
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含 Web Interface API 路由
app.include_router(api_router, prefix="/api/web")

# 现有路由已移除，只保留 SSE Agent 路由

# 现有路由已移除，只保留 SSE Agent 路由

# 创建全局 SSE API 实例
sse_api = SSEGTPlanner(verbose=True)

# 请求模型
class AgentContextRequest(BaseModel):
    """
    AgentContext 请求模型（直接对应后端 AgentContext）
    
    支持多模态消息（文本+图片）：
    dialogue_history 中的每条消息的 content 字段可以是：
    1. 纯文本字符串：
       {"role": "user", "content": "设计一个系统", "timestamp": "..."}
    
    2. 多模态列表（文本+图片）：
       {
           "role": "user",
           "content": [
               {"type": "text", "text": "分析这个架构图"},
               {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,...", "detail": "high"}}
           ],
           "timestamp": "..."
       }
    
    图片格式支持：
    - HTTP/HTTPS URL: "https://example.com/image.jpg"
    - Base64 Data URL: "data:image/jpeg;base64,/9j/4AAQ..."
    
    图片细节级别（detail）：
    - "auto": 自动选择（默认，平衡速度和准确性）
    - "low": 低细节模式（更快、更便宜，适合简单图片）
    - "high": 高细节模式（更慢、更贵，适合复杂图片如架构图、设计稿）
    """
    session_id: str
    dialogue_history: List[Dict[str, Any]]
    tool_execution_results: Dict[str, Any] = {}
    session_metadata: Dict[str, Any] = {}
    last_updated: Optional[str] = None
    is_compressed: bool = False
    language: Optional[str] = None  # 新增：语言选择字段，支持 'zh', 'en', 'ja', 'es', 'fr'

    # SSE 配置选项（不属于 AgentContext，但用于 API 配置）
    include_metadata: bool = False
    buffer_events: bool = False
    heartbeat_interval: float = 30.0

# 健康检查端点（增强版）
@app.get("/health")
async def health_check():
    """增强的健康检查端点，包含 API 状态信息"""
    api_status = sse_api.get_api_status()
    return {
        "status": "healthy",
        "service": "gtplanner",
        "timestamp": datetime.now().isoformat(),
        "api_status": api_status
    }

@app.get("/api/status")
async def api_status():
    """获取详细的 API 状态信息"""
    return sse_api.get_api_status()

# 测试页面端点已移除

# 普通聊天API已移除，只保留SSE Agent API

@app.post("/api/chat/agent")
async def chat_agent_stream(request: AgentContextRequest):
    """SSE 流式聊天端点 - GTPlanner Agent"""
    try:
        # 验证 AgentContext 数据
        if not request.session_id.strip():
            raise HTTPException(status_code=400, detail="session_id is required")

        if not request.dialogue_history:
            raise HTTPException(status_code=400, detail="dialogue_history cannot be empty")

        logger.info(f"Starting SSE stream for session: {request.session_id}, messages: {len(request.dialogue_history)}")

        # 解析多模态消息内容（如果 content 是 JSON 字符串，解析成数组）
        def parse_message_content(message: Dict[str, Any]) -> Dict[str, Any]:
            """解析消息内容，支持多模态格式"""
            content = message.get("content")
            if isinstance(content, str) and content.strip().startswith('['):
                try:
                    parsed = json.loads(content)
                    if isinstance(parsed, list):
                        message["content"] = parsed
                        logger.debug(f"Parsed multimodal content: {len(parsed)} parts")
                except json.JSONDecodeError:
                    # 解析失败，保持原字符串
                    pass
            return message
        
        # 处理 dialogue_history 中的所有消息
        parsed_history = [parse_message_content(msg.copy()) for msg in request.dialogue_history]
        request.dialogue_history = parsed_history

        async def generate_sse_stream():
            """生成 SSE 数据流"""
            try:
                # 发送对话开始事件（使用标准的 conversation_start 事件类型）
                conversation_start_event = {
                    "event_type": "conversation_start",
                    "timestamp": datetime.now().isoformat(),
                    "session_id": request.session_id,
                    "data": {
                        "user_input": request.dialogue_history[-1].get("content", "") if request.dialogue_history else "",
                        "dialogue_history_length": len(request.dialogue_history),
                        "config": {
                            "include_metadata": request.include_metadata,
                            "buffer_events": request.buffer_events,
                            "heartbeat_interval": request.heartbeat_interval
                        }
                    }
                }
                yield f"event: conversation_start\ndata: {json.dumps(conversation_start_event, ensure_ascii=False)}\n\n"

                # 创建一个队列来收集 SSE 数据
                import asyncio
                sse_queue = asyncio.Queue()
                processing_complete = False

                async def queue_sse_data(data: str):
                    """将 SSE 数据放入队列"""
                    await sse_queue.put(data)

                # 启动处理任务
                async def process_request():
                    nonlocal processing_complete
                    try:
                        # 构建 AgentContext 数据（移除冗余的 user_input）
                        agent_context = {
                            "session_id": request.session_id,
                            "dialogue_history": request.dialogue_history,
                            "tool_execution_results": request.tool_execution_results,
                            "session_metadata": request.session_metadata,
                            "last_updated": request.last_updated,
                            "is_compressed": request.is_compressed
                        }

                        language = request.session_metadata.get('language', 'zh')

                        result = await sse_api.process_request_stream(
                            agent_context=agent_context,
                            language=language,  # 作为独立参数传递语言选择
                            response_writer=queue_sse_data,
                            include_metadata=request.include_metadata,
                            buffer_events=request.buffer_events,
                            heartbeat_interval=request.heartbeat_interval
                        )

                        # 发送对话结束事件（使用标准的 conversation_end 事件类型）
                        conversation_end_event = {
                            "event_type": "conversation_end",
                            "timestamp": datetime.now().isoformat(),
                            "session_id": result.get('session_id'),
                            "data": result
                        }
                        await sse_queue.put(f"event: conversation_end\ndata: {json.dumps(conversation_end_event, ensure_ascii=False)}\n\n")

                        logger.info(f"SSE stream completed successfully for session: {result.get('session_id', 'unknown')}")

                    except Exception as e:
                        logger.error(f"SSE processing error: {e}", exc_info=True)
                        # 发送错误事件
                        error_event = {
                            "error": str(e),
                            "error_type": type(e).__name__,
                            "timestamp": datetime.now().isoformat()
                        }
                        await sse_queue.put(f"event: error\ndata: {json.dumps(error_event, ensure_ascii=False)}\n\n")
                    finally:
                        processing_complete = True
                        await sse_queue.put(None)  # 结束标记

                # 启动处理任务
                task = asyncio.create_task(process_request())

                # 从队列中读取并发送数据
                heartbeat_counter = 0
                while True:
                    try:
                        # 等待数据，使用较短超时以快速检测处理完成
                        data = await asyncio.wait_for(sse_queue.get(), timeout=0.1)
                        if data is None:  # 结束标记
                            break
                        yield data
                    except asyncio.TimeoutError:
                        # 检查是否处理完成
                        if processing_complete:
                            break
                        # 每100次超时发送一次心跳（每10秒）
                        heartbeat_counter += 1
                        if heartbeat_counter >= 100:
                            heartbeat = f"event: heartbeat\ndata: {{\"timestamp\": \"{datetime.now().isoformat()}\"}}\n\n"
                            yield heartbeat
                            heartbeat_counter = 0

                # 确保任务完成
                if not task.done():
                    await task

            except Exception as e:
                logger.error(f"SSE stream error: {e}", exc_info=True)
                # 发送错误事件
                error_event = {
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "timestamp": datetime.now().isoformat()
                }
                yield f"event: error\ndata: {json.dumps(error_event, ensure_ascii=False)}\n\n"

        return StreamingResponse(
            generate_sse_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # 禁用 Nginx 缓冲
            }
        )

    except Exception as e:
        logger.error(f"Chat agent stream error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# 静态文件服务（用于生产环境中的前端构建文件）
# 在开发中，Vite dev server 会处理静态文件
# 在生产中，确保 web/dist 目录存在并包含构建文件
frontend_dist_path = Path(__file__).parent / "web" / "dist"
if frontend_dist_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dist_path / "static")), name="static")

    # SPA fallback：对于所有非 API 路由，返回 index.html
    from fastapi.responses import FileResponse

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve frontend SPA (Single Page Application)"""
        index_file = frontend_dist_path / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        else:
            raise HTTPException(status_code=404, detail="Frontend not built")

    logger.info(f"🌐 Frontend static files served from: {frontend_dist_path}")
else:
    logger.info("⚠️  Frontend dist directory not found. Run 'cd web && npm run build' to build frontend.")

if __name__ == "__main__":
    uvicorn.run("fastapi_main:app", host="0.0.0.0", port=11211, reload=True)
