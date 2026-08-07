"""Local project setup managed by uv and Bun."""

from __future__ import annotations

from pathlib import Path
import shutil
import subprocess


PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
STATIC_DIR = PROJECT_ROOT / "static"


def build_frontend() -> None:
    """Install locked frontend dependencies and build assets into ./static."""
    bun = shutil.which("bun")
    if not bun:
        raise SystemExit(
            "Bun is required to build the Flow2API frontend. Install it from "
            "https://bun.sh, then run `uv run setup` again."
        )

    print("[flow2api] Syncing frontend dependencies with Bun...", flush=True)
    subprocess.run(
        [bun, "install", "--frozen-lockfile"],
        cwd=FRONTEND_DIR,
        check=True,
    )

    print("[flow2api] Building frontend assets...", flush=True)
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


def setup() -> None:
    """Install frontend dependencies and build the administration UI."""
    build_frontend()
    print(
        "[flow2api] Setup complete. Start the server with `uv run flow2api`.",
        flush=True,
    )
