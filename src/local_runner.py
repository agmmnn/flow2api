"""One-command local launcher managed by uv."""

from __future__ import annotations

import os
from pathlib import Path
import shutil
import subprocess


PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
STATIC_DIR = PROJECT_ROOT / "static"


def _frontend_build_disabled() -> bool:
    return os.getenv("FLOW2API_SKIP_FRONTEND_BUILD", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def build_frontend() -> None:
    """Install locked frontend dependencies and build assets into ./static."""
    if _frontend_build_disabled():
        return

    bun = shutil.which("bun")
    if not bun:
        raise SystemExit(
            "Bun is required to build the Flow2API frontend. Install it from "
            "https://bun.sh, then run `uv run flow2api` again."
        )

    print("[flow2api] Syncing frontend dependencies with Bun...")
    subprocess.run(
        [bun, "install", "--frozen-lockfile"],
        cwd=FRONTEND_DIR,
        check=True,
    )

    print("[flow2api] Building frontend assets...")
    subprocess.run(
        [
            bun,
            "run",
            "build",
            "--",
            "--outDir",
            str(STATIC_DIR),
            "--emptyOutDir",
        ],
        cwd=FRONTEND_DIR,
        check=True,
    )


def main() -> None:
    """Prepare the frontend and start the Flow2API backend."""
    build_frontend()

    from main import main as run_server

    run_server()
