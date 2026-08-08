"""Small FastAPI dependencies backed by the application-owned container."""

from __future__ import annotations

from fastapi import Request, WebSocket

from .container import AppContainer


def get_container(request: Request) -> AppContainer:
    """Return the dependency container for the current HTTP application."""

    return request.app.state.container


def get_websocket_container(websocket: WebSocket) -> AppContainer:
    """Return the dependency container for the current WebSocket application."""

    return websocket.app.state.container
