"""Explicit construction of Flow2API application dependencies."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

from ..core.api_key_manager import ApiKeyManager
from ..core.config import config
from ..core.database import Database, create_database
from ..services.concurrency_manager import ConcurrencyManager
from ..services.failed_payload_store import FailedPayloadManager, failed_payload_manager
from ..services.flow_client import FlowClient
from ..services.geminigen_service import GeminiGenService
from ..services.generation_handler import GenerationHandler
from ..services.google_drive_backup import GoogleDriveBackupService
from ..services.load_balancer import LoadBalancer
from ..services.proxy_manager import ProxyManager
from ..services.redis_runtime import RedisRuntime, redis_runtime
from ..services.runway_service import RunwayService
from ..services.token_manager import TokenManager
from .tasks import TaskRegistry


@dataclass(slots=True)
class AppContainer:
    """Dependencies owned by one FastAPI application instance.

    The container is deliberately passive: it does not resolve dependencies at
    runtime and is never stored as a process-wide singleton. FastAPI owns it via
    ``app.state.container`` and request dependencies retrieve it from there.
    """

    db: Database
    proxy_manager: ProxyManager
    flow_client: FlowClient
    token_manager: TokenManager
    concurrency_manager: ConcurrencyManager
    load_balancer: LoadBalancer
    generation_handler: GenerationHandler
    runway_service: RunwayService
    geminigen_service: GeminiGenService
    google_drive_backup_service: GoogleDriveBackupService
    api_key_manager: ApiKeyManager
    redis_runtime: RedisRuntime
    failed_payload_manager: FailedPayloadManager
    tasks: TaskRegistry = field(default_factory=TaskRegistry)
    database_restore_lock: asyncio.Lock = field(default_factory=asyncio.Lock)


def build_container(*, database: Database | None = None) -> AppContainer:
    """Build a complete, isolated application dependency graph."""

    db = database or create_database()
    proxy_manager = ProxyManager(db)
    flow_client = FlowClient(proxy_manager, db)
    token_manager = TokenManager(db, flow_client)
    concurrency_manager = ConcurrencyManager(redis_runtime=redis_runtime)
    load_balancer = LoadBalancer(token_manager, concurrency_manager)
    generation_handler = GenerationHandler(
        flow_client,
        token_manager,
        load_balancer,
        db,
        concurrency_manager,
        proxy_manager,
    )
    runway_service = RunwayService(db, generation_handler.file_cache, proxy_manager)
    geminigen_service = GeminiGenService(db, generation_handler.file_cache, proxy_manager)
    google_drive_backup_service = GoogleDriveBackupService(db, app_version="1.0.0")
    api_key_manager = ApiKeyManager(
        db,
        legacy_api_key_provider=lambda: config.api_key,
        redis_runtime=redis_runtime,
    )
    return AppContainer(
        db=db,
        proxy_manager=proxy_manager,
        flow_client=flow_client,
        token_manager=token_manager,
        concurrency_manager=concurrency_manager,
        load_balancer=load_balancer,
        generation_handler=generation_handler,
        runway_service=runway_service,
        geminigen_service=geminigen_service,
        google_drive_backup_service=google_drive_backup_service,
        api_key_manager=api_key_manager,
        redis_runtime=redis_runtime,
        failed_payload_manager=failed_payload_manager,
    )
