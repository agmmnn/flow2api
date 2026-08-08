from __future__ import annotations

import sqlite3

import aiosqlite
import pytest

from flow2api.core.database import Database
from flow2api.persistence.migrations.sqlite import (
    SQLiteMigrationError,
    discover_sqlite_migrations,
    prepare_sqlite_migrations,
    stamp_compatible_sqlite_database,
)


@pytest.mark.asyncio
async def test_fresh_sqlite_database_applies_checksummed_baseline(tmp_path) -> None:
    path = tmp_path / "fresh.db"
    async with aiosqlite.connect(path) as connection:
        state = await prepare_sqlite_migrations(connection)
        tracker = await connection.execute_fetchall("SELECT revision, checksum FROM schema_migrations")
        tables = await connection.execute_fetchall("SELECT name FROM sqlite_master WHERE type = 'table'")

    migration = discover_sqlite_migrations()[-1]
    assert state == "fresh"
    assert tracker == [(migration.revision, migration.checksum)]
    assert {row[0] for row in tables} >= {"tokens", "projects", "schema_migrations"}


@pytest.mark.asyncio
async def test_partial_legacy_sqlite_schema_fails_with_diagnostic(tmp_path) -> None:
    path = tmp_path / "partial.db"
    async with aiosqlite.connect(path) as connection:
        await connection.execute("CREATE TABLE tokens (id INTEGER PRIMARY KEY)")
        await connection.commit()

        with pytest.raises(SQLiteMigrationError, match="missing identity columns: tokens.st"):
            await prepare_sqlite_migrations(connection)


@pytest.mark.asyncio
async def test_compatible_existing_sqlite_schema_is_validated_before_stamp(tmp_path) -> None:
    path = tmp_path / "existing.db"
    async with aiosqlite.connect(path) as connection:
        await prepare_sqlite_migrations(connection)
        await connection.execute("DROP TABLE schema_migrations")
        await connection.commit()

        assert await prepare_sqlite_migrations(connection) == "legacy"
        revision = await stamp_compatible_sqlite_database(connection)
        tracker = await connection.execute_fetchall("SELECT revision, checksum FROM schema_migrations")

    assert revision == discover_sqlite_migrations()[-1].revision
    assert tracker == [
        (
            discover_sqlite_migrations()[-1].revision,
            discover_sqlite_migrations()[-1].checksum,
        )
    ]


@pytest.mark.asyncio
async def test_sqlite_migration_checksum_drift_is_rejected(tmp_path) -> None:
    path = tmp_path / "drift.db"
    async with aiosqlite.connect(path) as connection:
        await prepare_sqlite_migrations(connection)
        await connection.execute("UPDATE schema_migrations SET checksum = 'changed' WHERE revision = '0001'")
        await connection.commit()

        with pytest.raises(SQLiteMigrationError, match="Checksum mismatch"):
            await prepare_sqlite_migrations(connection)


@pytest.mark.asyncio
async def test_database_startup_records_sqlite_revision(tmp_path) -> None:
    path = tmp_path / "application.db"
    database = Database(str(path))
    await database.init_db()

    with sqlite3.connect(path) as connection:
        tracker = connection.execute("SELECT revision FROM schema_migrations ORDER BY revision").fetchall()

    assert database.database_revision == discover_sqlite_migrations()[-1].revision
    assert tracker == [(database.database_revision,)]
