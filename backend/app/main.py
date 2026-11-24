import asyncio
import logging
import os
import socket
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_cors_origins, settings
from app.database.init_db import init_db
from app.services.ai import close_http_client

import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(
        asyncio.WindowsProactorEventLoopPolicy()
    )

logger = logging.getLogger(__name__)
_mcp_process: asyncio.subprocess.Process | None = None


async def _start_local_mcp_server():
    global _mcp_process

    if not settings.start_mcp_server:
        logger.info("START_MCP_SERVER is disabled; expecting an externally hosted MCP server.")
        return

    backend_dir = Path(__file__).resolve().parents[1]
    child_env = os.environ.copy()
    child_env["MCP_HOST"] = settings.mcp_host
    child_env["MCP_PORT"] = str(settings.mcp_port)

    _mcp_process = await asyncio.create_subprocess_exec(
        sys.executable,
        "-m",
        "app.mcp_server.server",
        cwd=str(backend_dir),
        env=child_env,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.STDOUT,
    )

    for _ in range(60):
        if _mcp_process.returncode is not None:
            logger.error("MCP server exited during startup with code %s", _mcp_process.returncode)
            return
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection("127.0.0.1", settings.mcp_port),
                timeout=0.5,
            )
            writer.close()
            await writer.wait_closed()
            logger.info("Local MCP server is listening on port %s", settings.mcp_port)
            return
        except (OSError, asyncio.TimeoutError):
            await asyncio.sleep(0.25)

    logger.error("MCP server did not become ready; MCP-dependent features may be unavailable.")


async def _stop_local_mcp_server():
    global _mcp_process
    if _mcp_process and _mcp_process.returncode is None:
        _mcp_process.terminate()
        try:
            await asyncio.wait_for(_mcp_process.wait(), timeout=5)
        except asyncio.TimeoutError:
            _mcp_process.kill()
            await _mcp_process.wait()
    _mcp_process = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if os.getenv("START_LOCAL_MCP", "false").lower() == "true":
        await _start_local_mcp_server()
    try:
        yield
    finally:
        await _stop_local_mcp_server()
        await close_http_client()


app = FastAPI(
    title="PS-22 Proactive Digital Engagement Agent",
    version="2.0.0",
    description="Customer engagement platform with MCP-connected customer intelligence tools.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ps22-api"}


from app.api.routes import router

app.include_router(router)
